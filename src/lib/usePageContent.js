import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const cache = {};

export function usePageContent(pageKey) {
  const [content, setContent] = useState(cache[pageKey]?.content || {});
  const [sections, setSections] = useState(cache[pageKey]?.sections || {});
  const [loading, setLoading] = useState(!cache[pageKey]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (cache[pageKey]) {
        setContent(cache[pageKey].content);
        setSections(cache[pageKey].sections);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('page_contents')
          .select('content, sections')
          .eq('page_key', pageKey)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('page_contents load error:', error);
          setContent({});
          setSections({});
        } else if (data) {
          cache[pageKey] = { content: data.content || {}, sections: data.sections || {} };
          setContent(data.content || {});
          setSections(data.sections || {});
        } else {
          cache[pageKey] = { content: {}, sections: {} };
          setContent({});
          setSections({});
        }
      } catch (err) {
        if (!cancelled) {
          console.error('page_contents load error:', err);
          setContent({});
          setSections({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pageKey]);

  const getField = useCallback(
    (key, fallback = '') => {
      const val = content[key];
      return val !== undefined && val !== null ? val : fallback;
    },
    [content]
  );

  const isSectionVisible = useCallback(
    (sectionKey, fallback = true) => {
      const val = sections[sectionKey];
      return val !== undefined && val !== null ? val : fallback;
    },
    [sections]
  );

  return { content, sections, getField, isSectionVisible, loading };
}

export function clearPageContentCache(pageKey) {
  if (pageKey) {
    delete cache[pageKey];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
}

export function setPageContentCache(pageKey, content, sections) {
  cache[pageKey] = { content, sections };
}
