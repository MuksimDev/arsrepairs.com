#!/usr/bin/env python3
"""
Script to scrape blog posts from arsrepairs.com/blog/ and create markdown files
"""

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import html2text
import re
import os
from urllib.parse import urljoin, urlparse
from pathlib import Path
from datetime import datetime
import json
from PIL import Image
import io

BASE_URL = "https://arsrepairs.com"
BLOG_URL = f"{BASE_URL}/blog/"
CONTENT_DIR = Path("content/blog")
IMAGES_DIR = Path("themes/arsrepairs-theme/static/images")
TEMP_DIR = Path("temp_images")

def sanitize_filename(text):
    """Convert text to a valid filename"""
    # Remove special characters and replace spaces with hyphens
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def download_image(url, filename):
    """Download an image and convert to WebP"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Open image
        img = Image.open(io.BytesIO(response.content))
        
        # Convert RGBA to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Save as WebP
        webp_path = IMAGES_DIR / filename
        img.save(webp_path, 'WEBP', quality=85, method=6)
        return f"/images/{filename}"
    except Exception as e:
        print(f"Error downloading image {url}: {e}")
        return None

def extract_blog_urls():
    """Extract all blog post URLs from the blog listing page"""
    urls = []
    
    # Check multiple pages
    page = 1
    while True:
        if page == 1:
            url = BLOG_URL
        else:
            url = f"{BLOG_URL}page/{page}/?et_blog"
        
        print(f"Fetching blog listing from {url}...")
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find blog post links in h2 tags (common pattern)
            page_urls = []
            for h2 in soup.find_all('h2'):
                link = h2.find('a', href=True)
                if link:
                    href = link.get('href', '')
                    full_url = urljoin(BASE_URL, href)
                    if full_url.startswith(BASE_URL) and full_url not in urls:
                        page_urls.append(full_url)
            
            # Also check article tags
            for article in soup.find_all('article'):
                link = article.find('a', href=True)
                if link:
                    href = link.get('href', '')
                    full_url = urljoin(BASE_URL, href)
                    if full_url.startswith(BASE_URL) and full_url not in urls and full_url not in page_urls:
                        page_urls.append(full_url)
            
            if not page_urls:
                break  # No more posts on this page
            
            urls.extend(page_urls)
            page += 1
            
            # Check if there's a next page link
            next_link = soup.find('a', class_=re.compile(r'next|pagination', re.I))
            if not next_link:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching page {page}: {e}")
            break
    
    print(f"Found {len(urls)} blog post URLs")
    return urls

def scrape_blog_post(url, page=None):
    """Scrape a single blog post using Playwright for JS-rendered content"""
    print(f"\nScraping: {url}")
    try:
        if page:
            # Use Playwright page if provided
            page.goto(url, wait_until='networkidle', timeout=30000)
            html = page.content()
        else:
            # Fallback to requests
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            html = response.content
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract title
        title = None
        title_tag = soup.find('h1') or soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            # Clean up title
            title = re.sub(r'\s+', ' ', title)
        
        if not title:
            print(f"Warning: Could not find title for {url}")
            return None
        
        # Extract main content
        content_div = None
        
        # Try to find the main content area - wait a bit for JS to render
        # Common patterns: article, main, .entry-content, .post-content, etc.
        for selector in [
            'article .et_pb_post_content',
            'article .entry-content', 
            'article .post-content',
            'article main',
            'main article',
            'article',
            'main',
            '.entry-content',
            '.post-content',
            '.content',
            '[role="main"]',
            '.et_pb_post_content'
        ]:
            content_div = soup.select_one(selector)
            if content_div and len(content_div.get_text().strip()) > 100:
                break
        
        # If not found, try to find the main article content
        if not content_div or len(content_div.get_text().strip()) < 100:
            article = soup.find('article')
            if article:
                # Look for content divs within article that have substantial text
                for div in article.find_all('div', class_=True):
                    classes = ' '.join(div.get('class', []))
                    text_len = len(div.get_text().strip())
                    if ('content' in classes.lower() or 'entry' in classes.lower() or 'post' in classes.lower()) and text_len > 100:
                        content_div = div
                        break
                if not content_div or len(content_div.get_text().strip()) < 100:
                    # Use article if it has enough content
                    if len(article.get_text().strip()) > 100:
                        content_div = article
        
        # Final fallback: find the largest element with substantial text
        if not content_div or len(content_div.get_text().strip()) < 100:
            all_elements = soup.find_all(['div', 'article', 'main', 'section'])
            if all_elements:
                # Filter to elements with substantial text
                elements_with_text = [e for e in all_elements if len(e.get_text().strip()) > 200]
                if elements_with_text:
                    content_div = max(elements_with_text, key=lambda d: len(d.get_text().strip()))
        
        if not content_div or len(content_div.get_text().strip()) < 50:
            print(f"Warning: Could not find sufficient content for {url} (found {len(content_div.get_text().strip()) if content_div else 0} chars)")
            # Still return with what we have, but log the warning
            if not content_div:
                return None
        
        # Extract images
        images = []
        for img in content_div.find_all('img', src=True):
            img_url = img.get('src', '')
            if img_url:
                full_img_url = urljoin(BASE_URL, img_url)
                alt_text = img.get('alt', '')
                images.append({
                    'url': full_img_url,
                    'alt': alt_text,
                    'original_tag': str(img)
                })
        
        # Extract text content and convert to markdown
        # Remove script and style tags
        for script in content_div.find_all(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            script.decompose()
        
        # Remove social sharing, comments, and other non-content elements
        for elem in content_div.find_all(class_=re.compile(r'share|social|comment|sidebar|ad|advertisement', re.I)):
            elem.decompose()
        
        # Use html2text for better conversion
        h = html2text.HTML2Text()
        h.ignore_links = False
        h.ignore_images = False
        h.body_width = 0  # Don't wrap lines
        h.unicode_snob = True
        
        # Convert to markdown
        content = h.handle(str(content_div))
        
        # Clean up the markdown
        content = re.sub(r'\n{3,}', '\n\n', content)  # Remove excessive newlines
        content = content.strip()
        
        # Extract description/summary
        description = None
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            description = meta_desc.get('content', '').strip()
        
        # Extract date
        date = None
        date_tag = soup.find('time') or soup.find(class_=re.compile(r'date|published'))
        if date_tag:
            date_str = date_tag.get('datetime') or date_tag.get_text()
            try:
                date = datetime.strptime(date_str[:10], '%Y-%m-%d').strftime('%Y-%m-%d')
            except:
                pass
        
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        return {
            'url': url,
            'title': title,
            'content': content,
            'description': description or title,
            'date': date,
            'images': images
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def extract_markdown_from_html(element):
    """Convert HTML element to markdown"""
    text_parts = []
    
    for child in element.children:
        if hasattr(child, 'name'):
            tag = child.name
            text = child.get_text().strip()
            
            if tag == 'h1':
                text_parts.append(f"# {text}\n")
            elif tag == 'h2':
                text_parts.append(f"## {text}\n")
            elif tag == 'h3':
                text_parts.append(f"### {text}\n")
            elif tag == 'h4':
                text_parts.append(f"#### {text}\n")
            elif tag == 'p':
                if text:
                    text_parts.append(f"{text}\n\n")
            elif tag == 'ul' or tag == 'ol':
                for li in child.find_all('li', recursive=False):
                    text_parts.append(f"- {li.get_text().strip()}\n")
                text_parts.append("\n")
            elif tag == 'li':
                text_parts.append(f"- {text}\n")
            elif tag == 'strong' or tag == 'b':
                text_parts.append(f"**{text}**")
            elif tag == 'em' or tag == 'i':
                text_parts.append(f"*{text}*")
            elif tag == 'a':
                href = child.get('href', '')
                if href:
                    text_parts.append(f"[{text}]({href})")
                else:
                    text_parts.append(text)
            elif tag == 'img':
                # Images will be handled separately
                alt = child.get('alt', '')
                src = child.get('src', '')
                if src:
                    text_parts.append(f"![{alt}]({src})\n\n")
            else:
                # For other tags, just get the text
                if text:
                    text_parts.append(f"{text}\n\n")
        else:
            # Text node
            text = str(child).strip()
            if text:
                text_parts.append(text)
    
    return ''.join(text_parts).strip()

def create_markdown_file(post_data, slug):
    """Create a markdown file from post data"""
    # Determine categories based on content
    categories = []
    content_lower = post_data['content'].lower() + post_data['title'].lower()
    
    if 'dishwasher' in content_lower:
        categories.append('Dishwasher')
    if 'washer' in content_lower or 'washing machine' in content_lower:
        categories.append('Washer')
    if 'dryer' in content_lower:
        categories.append('Dryer')
    if 'refrigerator' in content_lower or 'fridge' in content_lower:
        categories.append('Refrigerator')
    if 'oven' in content_lower or 'stove' in content_lower:
        categories.append('Oven')
    if 'microwave' in content_lower:
        categories.append('Microwave')
    if 'error code' in content_lower or 'error codes' in content_lower:
        categories.append('Repair Guides')
    if 'temperature' in content_lower or 'maintenance' in content_lower:
        categories.append('Maintenance')
    
    if not categories:
        categories = ['Appliance Repair']
    
    # Determine topics
    topics = ['blog']
    if 'bosch' in content_lower:
        topics.append('bosch')
    if 'samsung' in content_lower:
        topics.append('samsung')
    if 'lg' in content_lower:
        topics.append('lg')
    if 'maytag' in content_lower:
        topics.append('maytag')
    if 'repair' in content_lower:
        topics.append('repair')
    
    # Process images
    image_paths = []
    for idx, img_data in enumerate(post_data['images']):
        if img_data['url']:
            # Generate filename
            img_filename = f"{slug}-{idx+1}.webp"
            if img_data['alt']:
                alt_slug = sanitize_filename(img_data['alt'])[:30]
                img_filename = f"{slug}-{alt_slug}.webp"
            
            # Download and convert image
            img_path = download_image(img_data['url'], img_filename)
            if img_path:
                image_paths.append(img_path)
                # Replace image reference in content
                if img_data['url'] in post_data['content']:
                    post_data['content'] = post_data['content'].replace(
                        img_data['url'], img_path
                    )
    
    # Use first image as og_image if available
    og_image = image_paths[0] if image_paths else "/images/dishwasher-not-cleaning.webp"
    
    # Create front matter
    front_matter = f"""---
title: "{post_data['title']}"
topics:
"""
    for topic in topics:
        front_matter += f'  - "{topic}"\n'
    
    front_matter += f"""layout: page
date: {post_data['date']}
lastmod: {datetime.now().strftime('%Y-%m-%d')}
author: "ARS Repair and Installation Services Inc."
summary: "{post_data['description'][:200]}"
seo:
 title: "{post_data['title']}"
 description: "{post_data['description'][:160]}"
 keywords: {json.dumps(topics)}
 og_image: "{og_image}"
 og_type: "article"
pageHeader:
 title: "{post_data['title']}"
 description: "{post_data['description'][:200]}"
 bg_image: "{og_image}"
 disableLocationSuffix: true
categories:
"""
    for category in categories:
        front_matter += f' - "{category}"\n'
    
    front_matter += """serviceAreas_section: false
sidebar:
 cta: true
 related: false
 nav: false
---

"""
    
    # Clean up content
    content = post_data['content']
    # Remove multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    # Fix markdown formatting issues
    content = re.sub(r'#+\s*\n', '', content)  # Remove empty headers
    
    # Add footer
    footer = """

---

ARS Appliance Repair Service has been trusted across Toronto, Ottawa, and Southern Ontario for over a decade. Our licensed, manufacturer-authorized technicians specialize in repairing all major household and commercial appliances with genuine parts and warranty-backed service. From refrigerators and washers to ovens, dishwashers, and more, we restore appliances quickly, professionally, and correctly the first time, earning the confidence of homeowners and businesses throughout the region.
"""
    
    full_content = front_matter + content + footer
    
    # Write file
    filepath = CONTENT_DIR / f"{slug}.md"
    filepath.write_text(full_content, encoding='utf-8')
    print(f"Created: {filepath}")
    
    return filepath

def main():
    """Main function"""
    # Create directories
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get blog post URLs
    urls = extract_blog_urls()
    
    if not urls:
        print("No blog post URLs found!")
        return
    
    # Use Playwright to scrape posts with JS-rendered content
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Scrape each post
        posts = []
        for url in urls:
            post_data = scrape_blog_post(url, page)
            if post_data:
                posts.append(post_data)
        
        browser.close()
    
    print(f"\nScraped {len(posts)} blog posts")
    
    # Create markdown files
    for post_data in posts:
        slug = sanitize_filename(post_data['title'])
        # Check if file already exists
        existing_file = CONTENT_DIR / f"{slug}.md"
        if existing_file.exists():
            print(f"Skipping {slug}.md (already exists)")
            continue
        
        create_markdown_file(post_data, slug)
    
    # Clean up temp directory
    if TEMP_DIR.exists():
        import shutil
        shutil.rmtree(TEMP_DIR)
    
    print("\nDone!")

if __name__ == "__main__":
    main()
