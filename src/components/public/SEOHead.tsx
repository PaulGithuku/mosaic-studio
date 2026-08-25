import React, { useEffect } from 'react';
import { Profile } from '../../types/auth';

interface SEOHeadProps {
  profile: Profile;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ profile }) => {
  useEffect(() => {
    if (!profile) return;

    // 1. Dynamic document title
    const specialtyText = profile.specialties?.length ? ` — ${profile.specialties.slice(0, 2).join(' & ')}` : '';
    const title = `${profile.name}${specialtyText} | MOSAIC STUDIO`;
    document.title = title;

    // 2. Meta description
    const description = profile.bio
      ? profile.bio.slice(0, 160)
      : `Explore the official photography portfolio and session commissions for ${profile.name} at MOSAIC Studio.`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Open Graph Tags
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:type', 'profile');
    setMetaTag('og:url', window.location.href);
    if (profile.profile_image_path) {
      setMetaTag('og:image', profile.profile_image_path);
    }

    // Twitter Card
    const setTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setTwitterTag('twitter:card', 'summary_large_image');
    setTwitterTag('twitter:title', title);
    setTwitterTag('twitter:description', description);
    if (profile.profile_image_path) {
      setTwitterTag('twitter:image', profile.profile_image_path);
    }

    return () => {
      document.title = 'Mosaic Studio — Premier Photographer Platform';
    };
  }, [profile]);

  return null;
};
