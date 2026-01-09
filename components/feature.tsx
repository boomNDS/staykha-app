"use client";

import {
  Building2,
  FileText,
  Gauge,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge>Features</Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-semibold text-left">
                Everything you need to manage properties
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                Streamline your property management workflow with powerful tools
                designed for efficiency.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <Building2 className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Building & Room Management
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Organize buildings by floors, track room status, and manage
                  occupancy with bulk creation tools.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md aspect-square p-6 flex justify-between flex-col">
              <Users className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Tenant Profiles
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Complete tenant information with contracts, emergency contacts,
                  and move-in tracking.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-md aspect-square p-6 flex justify-between flex-col">
              <Gauge className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Meter Readings
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Capture water and electric readings with photo uploads,
                  grouped by month for easy tracking.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <FileText className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Automated Billing
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Generate invoices automatically from meter readings with
                  configurable rates, PDF export, and Thai language support.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md aspect-square p-6 flex justify-between flex-col">
              <UserPlus className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Multi-Admin
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Invite team members with role-based access control for owners
                  and admins.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md aspect-square p-6 flex justify-between flex-col">
              <Settings className="w-8 h-8 stroke-1 text-primary" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight font-semibold">
                  Customizable Settings
                </h3>
                <p className="text-muted-foreground max-w-xs text-base mt-2">
                  Configure billing rates, company info, payment details, and
                  Thai invoice labels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
