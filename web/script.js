// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href')
    if (href === '#') return // Skip empty anchors (download button)

    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
})

// Add scroll effect to nav
const nav = document.querySelector('.nav')
let lastScroll = 0

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset

  if (currentScroll > 100) {
    nav.style.background = 'rgba(9, 9, 11, 0.95)'
  } else {
    nav.style.background = 'rgba(9, 9, 11, 0.8)'
  }

  lastScroll = currentScroll
})

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

// Observe feature cards and steps
document.querySelectorAll('.feature-card, .step').forEach((el) => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(20px)'
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
  observer.observe(el)
})

// Add stagger delay to feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
  card.style.transitionDelay = `${index * 0.1}s`
})

// Fetch latest release from GitHub API
async function fetchLatestRelease() {
  const downloadBtn = document.getElementById('download-btn')
  const heroDownloadBtn = document.querySelector('.hero-cta .btn-primary')

  if (!downloadBtn) return

  const repo = downloadBtn.dataset.repo || 'sderosiaux/meeting-copilot'

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)

    if (!response.ok) {
      // No releases yet - link to releases page
      downloadBtn.href = `https://github.com/${repo}/releases`
      if (heroDownloadBtn) {
        heroDownloadBtn.href = `https://github.com/${repo}/releases`
      }
      return
    }

    const release = await response.json()

    // Find macOS DMG (prefer arm64/universal, fallback to x64)
    const assets = release.assets || []
    const dmgAsset =
      assets.find((a) => a.name.endsWith('.dmg') && a.name.includes('arm64')) ||
      assets.find((a) => a.name.endsWith('.dmg')) ||
      assets.find((a) => a.name.endsWith('.zip') && a.name.includes('mac'))

    if (dmgAsset) {
      downloadBtn.href = dmgAsset.browser_download_url
      if (heroDownloadBtn) {
        heroDownloadBtn.href = dmgAsset.browser_download_url
      }
    } else {
      downloadBtn.href = release.html_url
      if (heroDownloadBtn) {
        heroDownloadBtn.href = release.html_url
      }
    }
  } catch (error) {
    console.log('Could not fetch latest release:', error)
    downloadBtn.href = `https://github.com/${repo}/releases`
  }
}

// Detect user's architecture for download
function detectArchitecture() {
  const downloadText = document.getElementById('download-text')
  if (!downloadText) return

  // Check if Apple Silicon
  const isAppleSilicon =
    navigator.userAgent.includes('Mac') &&
    (navigator.userAgent.includes('ARM') ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0))

  if (isAppleSilicon) {
    downloadText.textContent = 'Download for Mac (Apple Silicon)'
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchLatestRelease()
  detectArchitecture()
})
