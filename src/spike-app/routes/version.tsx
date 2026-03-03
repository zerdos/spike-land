import { useEffect, useState } from "react";

interface VersionAsset {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
}

interface VersionData {
  sha: string;
  buildTime: string;
  assets: VersionAsset[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeIcon(key: string): string {
  const ext = key.substring(key.lastIndexOf(".") + 1).toLowerCase();
  const icons: Record<string, string> = {
    js: "JS",
    css: "CSS",
    html: "HTML",
    wasm: "WASM",
    json: "JSON",
    svg: "SVG",
    png: "IMG",
    jpg: "IMG",
    ico: "ICO",
    woff2: "FONT",
    woff: "FONT",
    ttf: "FONT",
    map: "MAP",
    txt: "TXT",
  };
  return icons[ext] ?? ext.toUpperCase();
}

export function VersionPage() {
  const [data, setData] = useState<VersionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/version")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<VersionData>;
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load version"));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-2xl font-bold">Version</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load version info: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-2xl font-bold">Version</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-6 w-64 rounded bg-gray-200" />
          <div className="h-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  const shortSha = data.sha.slice(0, 7);
  const buildDate = new Date(data.buildTime);
  const buildTimeStr = isNaN(buildDate.getTime()) ? data.buildTime : buildDate.toLocaleString();

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sha).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Version</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Build SHA</div>
          <button
            onClick={expanded ? handleCopy : () => setExpanded(true)}
            className="mt-1 font-mono text-lg hover:text-blue-600"
            title={expanded ? "Click to copy" : "Click to expand"}
          >
            {expanded ? data.sha : shortSha}
          </button>
          {copied && <span className="ml-2 text-sm text-green-600">Copied!</span>}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Build Time</div>
          <div className="mt-1 text-lg">{buildTimeStr}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Deployed Assets ({data.assets.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-600">File</th>
                <th className="px-4 py-2 font-medium text-gray-600">Type</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Size</th>
                <th className="px-4 py-2 font-medium text-gray-600">Uploaded</th>
                <th className="px-4 py-2 font-medium text-gray-600" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.assets.map((asset) => (
                <tr key={asset.key} className="hover:bg-gray-50">
                  <td className="max-w-xs truncate px-4 py-2 font-mono text-xs" title={asset.key}>
                    {asset.key}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {fileTypeIcon(asset.key)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatSize(asset.size)}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(asset.uploaded).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`https://spike.land/${asset.key}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
