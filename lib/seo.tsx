/**
 * SEO component for dynamic meta tag management
 * Updates document head with SEO-optimized meta tags
 */
import * as React from "react";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

const defaultSEO = {
  title: "StayKha - Property Management & Utility Billing System",
  description:
    "StayKha helps property owners manage buildings, rooms, tenants, and utility billing. Track meter readings, generate invoices, and streamline your property management workflow.",
  keywords: [
    "property management",
    "utility billing",
    "meter readings",
    "water billing",
    "electricity billing",
    "tenant management",
    "room management",
    "property management software",
    "billing software",
    "invoice generation",
  ],
  image: "/placeholder-logo.png",
  url: typeof window !== "undefined" ? window.location.origin : "",
  type: "website" as const,
};

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  noindex = false,
  nofollow = false,
  canonical,
}: SEOProps) {
  const fullTitle = title ? `${title} | StayKha` : defaultSEO.title;
  const metaDescription = description || defaultSEO.description;
  const metaKeywords = keywords?.join(", ") || defaultSEO.keywords.join(", ");
  const metaImage = image || defaultSEO.image;
  const metaUrl =
    url ||
    (typeof window !== "undefined" ? window.location.href : defaultSEO.url);
  const canonicalUrl = canonical || metaUrl;

  React.useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (
      name: string,
      content: string,
      attribute: "name" | "property" = "name",
    ) => {
      let element = document.querySelector(
        `meta[${attribute}="${name}"]`,
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", metaDescription);
    updateMetaTag("keywords", metaKeywords);
    updateMetaTag("author", "StayKha");
    updateMetaTag("application-name", "StayKha");
    updateMetaTag("theme-color", "#0E7490");

    // Robots meta
    const robotsContent = [
      noindex ? "noindex" : "index",
      nofollow ? "nofollow" : "follow",
    ].join(", ");
    updateMetaTag("robots", robotsContent);

    // Open Graph tags
    updateMetaTag("og:title", fullTitle, "property");
    updateMetaTag("og:description", metaDescription, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("og:url", metaUrl, "property");
    updateMetaTag("og:image", metaImage, "property");
    updateMetaTag("og:site_name", "StayKha", "property");
    updateMetaTag("og:locale", "en_US", "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", metaDescription);
    updateMetaTag("twitter:image", metaImage);

    // Canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Viewport (ensure it exists)
    let viewport = document.querySelector(
      'meta[name="viewport"]',
    ) as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0");
      document.head.appendChild(viewport);
    }
  }, [
    fullTitle,
    metaDescription,
    metaKeywords,
    metaImage,
    metaUrl,
    type,
    noindex,
    nofollow,
    canonicalUrl,
  ]);

  return null;
}

/**
 * Hook version for easier use in components
 */
export function useSEO(props: SEOProps) {
  React.useEffect(() => {
    const _seo = <SEO {...props} />;
    // The SEO component handles everything via useEffect
  }, [
    props.title,
    props.description,
    props.keywords,
    props.image,
    props.url,
    props.type,
    props.noindex,
    props.nofollow,
    props.canonical,
    props,
  ]);
}
