import { MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export interface Resource {
  id: string;
  name: string;
  address: string;
  distance: string;
  isOpen: boolean;
  hours: string;
  phone?: string;
  website?: string;
  tags?: string[];
}

interface ResourceCardProps {
  resource: Resource;
  icon?: LucideIcon;
}

const ResourceCard = ({ resource, icon: Icon }: ResourceCardProps) => {
  return (
    <div className="card-resource flex items-center gap-3">
      {Icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-display text-sm text-foreground truncate">{resource.name}</h3>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              resource.isOpen
                ? "bg-safe/15 text-safe"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {resource.isOpen ? "Open" : "Closed"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {resource.distance}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {resource.hours}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {resource.phone && (
            <a
              href={`tel:${resource.phone}`}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}
          {resource.website && (
            <button
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={async (e) => {
                e.stopPropagation();
                if (Capacitor.isNativePlatform()) {
                  await Browser.open({ url: resource.website! });
                } else {
                  window.open(resource.website, "_blank");
                }
              }}
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
