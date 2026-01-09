"use client";

import { Info, Loader2, Save } from "lucide-react";
import * as React from "react";
import { AdminRestrictionBanner } from "@/components/admin-restriction-banner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/hooks/use-settings";
import { useTeam } from "@/lib/hooks/use-team";
import type { AdminSettings } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

// Helper component for labels with info tooltips
function LabelWithInfo({
  htmlFor,
  children,
  tooltip,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
}) {
  if (!tooltip) {
    return <Label htmlFor={htmlFor}>{children}</Label>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="More information"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

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
    // Payment & Billing defaults
    bankName: "",
    bankAccountNumber: "",
    lineId: "",
    latePaymentPenaltyPerDay: 0,
    dueDateDayOfMonth: 5,
    // Thai Labels defaults
    labelInvoice: "ใบแจ้งหนี้",
    labelRoomRent: "ค่าเช่าห้อง",
    labelWater: "ค่าน้ำประปา",
    labelElectricity: "ค่าไฟฟ้า",
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
      // Ensure teamId is set
      const settingsToSave = {
        ...formSettings,
        teamId: formSettings.teamId || user?.teamId || "",
      };
      await updateSettings(settingsToSave);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      console.error("Settings save error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save settings";
      toast({
        title: "Error",
        description: errorMessage,
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

  // Show message if settings don't exist
  if (!settings) {
    // If admin, show restriction banner
    if (user?.role !== "owner") {
      return (
        <div className="space-y-6 pb-8">
          <PageHeader
            title="Settings"
            description="Manage billing rates and company information."
          />
          <AdminRestrictionBanner
            title="Settings Not Created"
            message="Settings have not been created for your team yet. Only owners can create settings."
            action="Please contact your team owner to create the initial settings. Once created, you can view and update them."
          />
        </div>
      );
    }
    
    // If owner, show create button
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Settings"
          description="Manage billing rates and company information."
        />
        <Card>
          <CardHeader>
            <CardTitle>Settings Not Found</CardTitle>
            <CardDescription>
              You need to create settings for your team before you can manage them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Click the button below to create default settings for your team. You can then customize them as needed.
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Settings...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                <LabelWithInfo
                  htmlFor="waterBillingMode"
                  tooltip="Choose how water is billed: 'Metered' charges per cubic meter (m³) used, 'Fixed' charges a flat monthly fee regardless of usage."
                >
                  Water Billing Mode
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="waterFixedFee"
                  tooltip="Monthly fixed fee for water when Water Billing Mode is set to 'Fixed'. This amount is charged regardless of water usage."
                >
                  Water Fixed Fee
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="waterRate"
                  tooltip="Rate charged per cubic meter (m³) of water consumed. Only applies when Water Billing Mode is set to 'Metered'."
                >
                  Water Rate (per m³)
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="electricRate"
                  tooltip="Rate charged per kilowatt-hour (kWh) of electricity consumed. This is always calculated based on meter readings."
                >
                  Electric Rate (per kWh)
                </LabelWithInfo>
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
              <LabelWithInfo
                htmlFor="taxRate"
                tooltip="Value Added Tax (VAT) percentage applied to the subtotal. For example, 7% means 7% tax will be added to the total bill amount."
              >
                Tax Rate (%)
              </LabelWithInfo>
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
              <LabelWithInfo
                htmlFor="companyName"
                tooltip="Your company or organization name that will appear on invoices."
              >
                Company Name
              </LabelWithInfo>
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
              <LabelWithInfo
                htmlFor="companyAddress"
                tooltip="Company address that will be displayed on invoices."
              >
                Address
              </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="companyPhone"
                  tooltip="Company phone number for contact information on invoices."
                >
                  Phone
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="companyEmail"
                  tooltip="Company email address for billing inquiries."
                >
                  Email
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="paymentTerms"
                  tooltip="Number of days after invoice issue date before payment is due. Used as fallback if 'Due Date Day of Month' is not set."
                >
                  Payment Terms (Days)
                </LabelWithInfo>
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
              <LabelWithInfo
                htmlFor="currency"
                tooltip="Currency code used for all monetary values (e.g., 'THB' for Thai Baht, 'USD' for US Dollars)."
              >
                Currency
              </LabelWithInfo>
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

        {/* Payment & Billing Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Billing Details</CardTitle>
            <CardDescription>
              Bank information and payment instructions for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="bankName"
                  tooltip="Name of the bank where payments should be made. This will appear on invoices as 'ชำระเงินได้ที่ [Bank Name]'."
                >
                  Bank Name
                </LabelWithInfo>
                <Input
                  id="bankName"
                  value={formSettings.bankName || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      bankName: e.target.value,
                    })
                  }
                  placeholder="ธนาคารกรุงไทย"
                />
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="bankAccountNumber"
                  tooltip="Bank account number where tenants should send payments. Displayed on invoices after the bank name."
                >
                  Bank Account Number
                </LabelWithInfo>
                <Input
                  id="bankAccountNumber"
                  value={formSettings.bankAccountNumber || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      bankAccountNumber: e.target.value,
                    })
                  }
                  placeholder="878-0-51077-9"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="lineId"
                  tooltip="LINE ID for contact/payment inquiries. Displayed on invoices on a separate line as 'ไอดีไลน์ [Line ID]'."
                >
                  Line ID
                </LabelWithInfo>
                <Input
                  id="lineId"
                  value={formSettings.lineId || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      lineId: e.target.value,
                    })
                  }
                  placeholder="@379zxxta"
                />
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="dueDateDayOfMonth"
                  tooltip="Day of the month when invoices are due (1-31). For example, 5 means bills are due on the 5th of every month. This overrides 'Payment Terms (Days)' if set."
                >
                  Due Date Day of Month
                </LabelWithInfo>
                <Input
                  id="dueDateDayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formSettings.dueDateDayOfMonth || 5}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      dueDateDayOfMonth: Number.parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  Day of month when bills are due (e.g., 5 = 5th of every month)
                </p>
              </div>
            </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="latePaymentPenaltyPerDay"
                  tooltip="Daily penalty fee charged when payment is overdue. Displayed on invoices as 'หากเกินกำหนด ชำระค่าปรับวันละ [amount]'. Set to 0 to disable."
                >
                  Late Payment Penalty (per day)
                </LabelWithInfo>
              <Input
                id="latePaymentPenaltyPerDay"
                type="number"
                min="0"
                step="0.01"
                value={formSettings.latePaymentPenaltyPerDay || 0}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    latePaymentPenaltyPerDay: Number.parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground">
                Penalty amount charged per day for late payments (0 to disable)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thai Labels (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Labels (Thai)</CardTitle>
            <CardDescription>
              Customize Thai labels for invoice items (leave empty for defaults)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="labelInvoice"
                  tooltip="Thai label for 'Invoice' that appears at the top of invoices. Default: 'ใบแจ้งหนี้'."
                >
                  Invoice Title
                </LabelWithInfo>
                <Input
                  id="labelInvoice"
                  value={formSettings.labelInvoice || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      labelInvoice: e.target.value,
                    })
                  }
                  placeholder="ใบแจ้งหนี้"
                />
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="labelRoomRent"
                  tooltip="Thai label for 'Room Rent' in the invoice table. Default: 'ค่าเช่าห้อง'."
                >
                  Room Rent Label
                </LabelWithInfo>
                <Input
                  id="labelRoomRent"
                  value={formSettings.labelRoomRent || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      labelRoomRent: e.target.value,
                    })
                  }
                  placeholder="ค่าเช่าห้อง"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="labelWater"
                  tooltip="Thai label for 'Water' in the invoice table. Default: 'ค่าน้ำประปา'."
                >
                  Water Label
                </LabelWithInfo>
                <Input
                  id="labelWater"
                  value={formSettings.labelWater || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      labelWater: e.target.value,
                    })
                  }
                  placeholder="ค่าน้ำประปา"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labelElectricity">Electricity Label</Label>
                <Input
                  id="labelElectricity"
                  value={formSettings.labelElectricity || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      labelElectricity: e.target.value,
                    })
                  }
                  placeholder="ค่าไฟฟ้า"
                />
              </div>
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
                <LabelWithInfo
                  htmlFor="defaultRoomRent"
                  tooltip="Default monthly rent amount suggested when creating new rooms. Can be changed per room."
                >
                  Default Monthly Rent
                </LabelWithInfo>
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
                <LabelWithInfo
                  htmlFor="defaultRoomSize"
                  tooltip="Default room size in square meters suggested when creating new rooms. Can be changed per room."
                >
                  Default Room Size (sqm)
                </LabelWithInfo>
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
