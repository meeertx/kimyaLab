import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
}

export const useSEO = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website'
}: SEOProps = {}) => {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Update document title
    const baseTitle = 'Kimyalab - Bilimsel İnovasyonun Merkezi'
    document.title = title ? `${title} | ${baseTitle}` : baseTitle

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description || 'Kimya ve yaşam bilimleri alanında yüksek kaliteli ürünler ve çözümler. Modern teknolojiler ve uzman kadromuzla bilimsel projelerinizi destekliyoruz.')
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      const defaultKeywords = ['kimya', 'laboratuvar', 'kimyasal', 'bilim', 'araştırma', 'analiz', 'reagent', 'buffer', 'solvent']
      const allKeywords = [...defaultKeywords, ...keywords].join(', ')
      metaKeywords.setAttribute('content', allKeywords)
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateOGTag('og:title', title || baseTitle)
    updateOGTag('og:description', description || 'Kimya ve yaşam bilimleri alanında yüksek kaliteli ürünler ve çözümler.')
    updateOGTag('og:type', type)
    updateOGTag('og:url', url || window.location.href)
    updateOGTag('og:image', image || '/images/kimyalab-og-image.jpg')
    updateOGTag('og:site_name', 'Kimyalab')
    updateOGTag('og:locale', i18n.language === 'tr' ? 'tr_TR' : i18n.language === 'en' ? 'en_US' : 'ar_SA')

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateTwitterTag('twitter:card', 'summary_large_image')
    updateTwitterTag('twitter:title', title || baseTitle)
    updateTwitterTag('twitter:description', description || 'Kimya ve yaşam bilimleri alanında yüksek kaliteli ürünler ve çözümler.')
    updateTwitterTag('twitter:image', image || '/images/kimyalab-og-image.jpg')

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', url || window.location.href)

    // Update language alternate links
    const updateAlternateLink = (lang: string, href: string) => {
      let alternateLink = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`)
      if (!alternateLink) {
        alternateLink = document.createElement('link')
        alternateLink.setAttribute('rel', 'alternate')
        alternateLink.setAttribute('hreflang', lang)
        document.head.appendChild(alternateLink)
      }
      alternateLink.setAttribute('href', href)
    }

    const currentPath = window.location.pathname
    updateAlternateLink('tr', `${window.location.origin}${currentPath}`)
    updateAlternateLink('en', `${window.location.origin}/en${currentPath}`)
    updateAlternateLink('ar', `${window.location.origin}/ar${currentPath}`)
    updateAlternateLink('x-default', `${window.location.origin}${currentPath}`)

  }, [title, description, keywords, image, url, type, i18n.language])
}

// Structured data helpers
export const generateProductStructuredData = (product: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "TRY",
      "availability": product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Kimyalab"
      }
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "CAS Number",
        "value": product.cas
      },
      {
        "@type": "PropertyValue",
        "name": "Molecular Formula",
        "value": product.formula
      },
      {
        "@type": "PropertyValue",
        "name": "Purity",
        "value": product.purity
      }
    ]
  }
}

export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kimyalab",
    "description": "Kimya ve yaşam bilimleri alanında yüksek kaliteli ürünler ve çözümler sunan önder kuruluş",
    "url": "https://kimyalab.com",
    "logo": "https://kimyalab.com/images/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+90-312-123-4567",
      "contactType": "Customer Service",
      "areaServed": "TR",
      "availableLanguage": ["Turkish", "English", "Arabic"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bilim Teknoloji Cd. No:123",
      "addressLocality": "Ankara",
      "postalCode": "06000",
      "addressCountry": "TR"
    },
    "sameAs": [
      "https://linkedin.com/company/kimyalab",
      "https://twitter.com/kimyalab",
      "https://instagram.com/kimyalab"
    ]
  }
}

export const injectStructuredData = (data: object, id?: string) => {
  const scriptId = id || 'structured-data'
  
  // Remove existing structured data with same ID
  const existingScript = document.getElementById(scriptId)
  if (existingScript) {
    existingScript.remove()
  }
  
  // Inject new structured data
  const script = document.createElement('script')
  script.id = scriptId
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}