# ARS Repairs Website

Hugo site using the arsrepairs-theme.

## Setup

This site uses the `arsrepairs-theme` as a Git submodule.

### First Time Setup

If you've cloned this repository, initialize the submodule:

```powershell
git submodule update --init --recursive
```

### Development

1. Make sure Hugo is installed: https://gohugo.io/installation/
2. Start the development server:
   ```powershell
   hugo server
   ```
3. Open http://localhost:1313 in your browser

### Theme Updates

To update the theme to the latest version:

```powershell
git submodule update --remote themes/arsrepairs-theme
git add themes/arsrepairs-theme
git commit -m "Update theme submodule"
```

### Project Structure

- `hugo.toml` - Main Hugo configuration file
- `themes/arsrepairs-theme/` - Theme installed as Git submodule
- `content/` - Site content (create this directory for your pages)
- `data/` - Data files (create this directory if needed)
- `static/` - Static assets (create this directory if needed)

### Notes

- The theme repository contains example content in `themes/arsrepairs-theme/content/` which you can reference or copy to your root `content/` directory
- The theme uses a nested theme structure: `arsrepairs-theme` uses `arsrepairs` internally
- Update the `baseURL` in `hugo.toml` when deploying to production
