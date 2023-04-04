import { ofetch } from "ofetch";
import { readPackageJSON } from "pkg-types";
import semver from "semver";

interface ReturnPkgVersion {
  latest?: string;
  current?: string;
}

const REGISTRY_URL = "https://registry.npmjs.org";

// Check the latest version of a package
export async function checkPkgVersion(name: string): Promise<ReturnPkgVersion> {
  const latest = await ofetch(`${REGISTRY_URL}/${name}`, { retry: 3 })
    .then((reg) => {
      const {
        "dist-tags": { latest },
      } = reg;
      return latest;
    })
    .catch(() => undefined);

  const current = await readPackageJSON()
    .then((pkg) => pkg.version)
    .catch(() => undefined);

  return {
    latest,
    current,
  };
}

// Check if the current version is outdated
export function isPkgOutdated(pkgVer: ReturnPkgVersion): boolean {
  const { latest, current } = pkgVer;

  if (!latest || !current) {
    return false;
  }

  return semver.lt(current, latest);
}
