import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
}

export const usePageSeo = ({ title, description, keywords }: SeoProps) => {
  useEffect(() => {
    // 1. Set Document Title
    document.title = `${title} | ElimuCloud`;

    // 2. Set or Update Meta Description
    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Set or Update Meta Keywords (optional)
    if (keywords) {
      let metaKeywords = document.querySelector("meta[name='keywords']");
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
  }, [title, description, keywords]);
};