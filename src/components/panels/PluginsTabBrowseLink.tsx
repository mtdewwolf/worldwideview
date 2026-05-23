import { ExternalLink } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function BrowseLink() {
    return (
      <a
        href="https://marketplace.worldwideview.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="plugins-tab__browse"
        onClick={() => trackEvent("marketplace-browse-click")}
      >
        <ExternalLink size={14} />
        Marketplace
      </a>
    );
}
