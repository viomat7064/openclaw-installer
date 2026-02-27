import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

export interface BundledResource {
  name: string;
  path: string;
  size: number;
  exists: boolean;
}

export interface MirrorConfig {
  npm: string;
  github: string;
}

export function useResources() {
  const [resources, setResources] = useState<BundledResource[]>([]);
  const [mirrors, setMirrors] = useState<MirrorConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBundledResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<BundledResource[]>('list_bundled_resources');
      setResources(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const getMirrors = async () => {
    try {
      const result = await invoke<MirrorConfig>('get_mirrors');
      setMirrors(result);
    } catch (err) {
      console.error('Failed to load mirrors:', err);
    }
  };

  const extractBundledOpenclaw = async (targetDir: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<string>('extract_bundled_openclaw', { targetDir });
      return result;
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listBundledResources();
    getMirrors();
  }, []);

  return {
    resources,
    mirrors,
    loading,
    error,
    listBundledResources,
    extractBundledOpenclaw,
  };
}
