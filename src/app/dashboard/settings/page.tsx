"use client";

import { Loader2, Save } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/hooks/use-settings";
import { useTeam } from "@/lib/hooks/use-team";
import type { AdminSettings } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  usePageTitle("Settings");

  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, isLoading, isUpdating, updateSettings } = useSettings();
  const {
    team,
    isLoading: isTeamLoading,
    isUpdating: isSavingTeam,
    updateTeam,
  } = useTeam();
  const [isSaving, setIsSaving] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");

  // Initialize form state with settings
  const [formSettings, setFormSettings] = React.useState<AdminSettings>({
    teamId: user?.teamId || "",
    waterRatePerUnit: 25,
    waterBillingMode: "metered",
    waterFixedFee: 0,
    electricRatePerUnit: 4.5,
    taxRate: 7,
    currency: "THB",
    companyName: "StayKha",
    companyAddress: "123 Campus Drive, University City, UC 12345",
    companyPhone: "+66-2-123-4567",
    companyEmail: "billing@dormitory.edu",
    invoicePrefix: "INV",
    paymentTermsDays: 15,
    defaultRoomRent: 4500,
    defaultRoomSize: 28,
  });

  React.useEffect(() => {
    if (settings) {
      setFormSettings({
        ...settings,
        teamId: settings.teamId || user?.teamId || "",
      });
    }
  }, [settings, user?.teamId]);

  React.useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formSettings);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await updateTeam({ name: teamName.trim() });
      // Update user in localStorage if team name changed
      if (user && data.team) {
        const updatedUser = {
          ...user,
          team: data.team,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userUpdated"));
      }
      toast({
        title: "Success",
        description: "Team name updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update team name",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Settings"
        description="Manage billing rates and company information."
      />

      <div className="space-y-6">
        {/* Team Management (Owner Only) */}
        {user?.role === "owner" && team && (
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Manage your team/organization name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveTeam}
                    disabled={isSavingTeam || teamName === team.name}
                  >
                    {isSavingTeam ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Rates</CardTitle>
            <CardDescription>
              Set the rates per unit for water and electricity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="waterBillingMode">Water Billing Mode</Label>
                <Select
                  value={formSettings.waterBillingMode}
                  onValueChange={(value) =>
                    setFormSettings({
                      ...formSettings,
                      waterBillingMode: value as "metered" | "fixed",
                    })
                  }
                >
                  <SelectTrigger id="waterBillingMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metered">Metered (per m³)</SelectItem>
                    <SelectItem value="fixed">Fixed Monthly Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterFixedFee">Water Fixed Fee</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formSettings.currency}
                  </span>
                  <Input
                    id="waterFixedFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSettings.waterFixedFee}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        waterFixedFee: Number.parseFloat(e.target.value),
                      })
                    }
                    disabled={formSettings.waterBillingMode !== "fixed"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formSettings.waterBillingMode === "fixed"
                    ? `Applied per month: ${formatCurrency(formSettings.waterFixedFee, formSettings.currency)}`
                    : "Switch to fixed to enable."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterRate">Water Rate (per m³)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formSettings.currency}
                  </span>
                  <Input
                    id="waterRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSettings.waterRatePerUnit}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        waterRatePerUnit: Number.parseFloat(e.target.value),
                      })
                    }
                    disabled={formSettings.waterBillingMode === "fixed"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  {formatCurrency(
                    formSettings.waterRatePerUnit,
                    formSettings.currency,
                  )}{" "}
                  per m³
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricRate">Electric Rate (per kWh)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formSettings.currency}
                  </span>
                  <Input
                    id="electricRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSettings.electricRatePerUnit}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        electricRatePerUnit: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  {formatCurrency(
                    formSettings.electricRatePerUnit,
                    formSettings.currency,
                  )}{" "}
                  per kWh
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formSettings.taxRate}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    taxRate: Number.parseFloat(e.target.value),
                    teamId: formSettings.teamId || user?.teamId || "",
                  })
                }
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Details that appear on invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formSettings.companyName}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    companyName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input
                id="companyAddress"
                value={formSettings.companyAddress}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    companyAddress: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={formSettings.companyPhone}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      companyPhone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formSettings.companyEmail}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      companyEmail: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>
              Configure invoice generation options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formSettings.invoicePrefix}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoicePrefix: e.target.value,
                    })
                  }
                  placeholder="INV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="1"
                  value={formSettings.paymentTermsDays}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      paymentTermsDays: Number.parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formSettings.currency}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, currency: e.target.value })
                }
                placeholder="THB"
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Defaults</CardTitle>
            <CardDescription>Applied when creating new rooms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultRoomRent">Default Monthly Rent</Label>
                <Input
                  id="defaultRoomRent"
                  type="number"
                  min="0"
                  value={formSettings.defaultRoomRent}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      defaultRoomRent: Number.parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRoomSize">Default Room Size (sqm)</Label>
                <Input
                  id="defaultRoomSize"
                  type="number"
                  min="0"
                  value={formSettings.defaultRoomSize}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      defaultRoomSize: Number.parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
