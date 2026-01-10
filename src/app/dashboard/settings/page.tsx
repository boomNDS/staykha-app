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
              aria-label="ข้อมูลเพิ่มเติม"
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
    companyAddress: "123 ถนนมหาวิทยาลัย เมืองมหาวิทยาลัย 12345",
    companyPhone: "+66-2-123-4567",
    companyEmail: "billing@staykha.com",
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
        title: "บันทึกสำเร็จ",
        description: "บันทึก Settings เรียบร้อย",
      });
    } catch (error: any) {
      console.error("Settings save error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save settings";
      toast({
        title: "เกิดข้อผิดพลาด",
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
        title: "เกิดข้อผิดพลาด",
        description: "กรุณากรอกชื่อทีม",
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
        title: "บันทึกสำเร็จ",
        description: "อัปเดตชื่อทีมเรียบร้อย",
      });
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดตชื่อทีมได้",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingState message="กำลังโหลด Settings..." />;
  }

  // Show message if settings don't exist
  if (!settings) {
    // If admin, show restriction banner
    if (user?.role !== "owner") {
      return (
        <div className="space-y-6 pb-8">
          <PageHeader
            title="Settings"
            description="จัดการอัตราค่าบริการและข้อมูลบริษัท"
          />
          <AdminRestrictionBanner
            title="ยังไม่ได้สร้าง Settings"
            message="ทีมของคุณยังไม่ได้สร้าง Settings เฉพาะเจ้าของเท่านั้นที่สามารถสร้างได้"
            action="กรุณาติดต่อเจ้าของทีมเพื่อสร้าง Settings เริ่มต้น เมื่อสร้างแล้วคุณจะสามารถดูและแก้ไขได้"
          />
        </div>
      );
    }
    
    // If owner, show create button
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Settings"
          description="จัดการอัตราค่าบริการและข้อมูลบริษัท"
        />
        <Card>
          <CardHeader>
            <CardTitle>ไม่พบ Settings</CardTitle>
            <CardDescription>
              คุณต้องสร้าง Settings ของทีมก่อนจึงจะจัดการได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              คลิกปุ่มด้านล่างเพื่อสร้าง Settings เริ่มต้น แล้วจึงปรับแต่งตามต้องการ
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสร้าง Settings...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  สร้าง Settings
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
        description="จัดการอัตราค่าบริการและข้อมูลบริษัท"
      />

      <div className="space-y-6">
        {/* Team Management (Owner Only) */}
        {user?.role === "owner" && team && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลทีม</CardTitle>
              <CardDescription>
                จัดการชื่อทีม/องค์กรของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">ชื่อทีม</Label>
                <div className="flex gap-2">
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="กรอกชื่อทีม"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveTeam}
                    disabled={isSavingTeam || teamName === team.name}
                  >
                    {isSavingTeam ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        บันทึก
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
            <CardTitle>อัตราค่าบริการ</CardTitle>
            <CardDescription>
              กำหนดอัตราต่อหน่วยสำหรับค่าน้ำและค่าไฟ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="waterBillingMode"
                  tooltip="เลือกวิธีคิดค่าน้ำ: แบบมิเตอร์คิดตามจำนวนที่ใช้ (m³), แบบเหมาจ่ายคิดรายเดือนเท่ากันทุกเดือน"
                >
                  โหมดการคิดค่าน้ำ
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
                    <SelectItem value="metered">ตามมิเตอร์ (ต่อ m³)</SelectItem>
                    <SelectItem value="fixed">เหมาจ่ายรายเดือน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="waterFixedFee"
                  tooltip="ค่าน้ำเหมาจ่ายรายเดือนเมื่อเลือกโหมด 'เหมาจ่าย' คิดเท่ากันทุกเดือนไม่ขึ้นกับการใช้น้ำ"
                >
                  ค่าน้ำเหมาจ่าย
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
                    ? `คิดต่อเดือน: ${formatCurrency(formSettings.waterFixedFee, formSettings.currency)}`
                    : "เปลี่ยนเป็นเหมาจ่ายเพื่อใช้งาน"}
                </p>
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="waterRate"
                  tooltip="อัตราค่าน้ำต่อ m³ ใช้เมื่อเลือกโหมด 'ตามมิเตอร์' เท่านั้น"
                >
                  อัตราค่าน้ำ (ต่อ m³)
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
                  ตัวอย่าง:{" "}
                  {formatCurrency(
                    formSettings.waterRatePerUnit,
                    formSettings.currency,
                  )}{" "}
                  ต่อ m³
                </p>
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="electricRate"
                  tooltip="อัตราค่าไฟต่อ kWh คำนวณจากการอ่านมิเตอร์เสมอ"
                >
                  อัตราค่าไฟ (ต่อ kWh)
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
                  ตัวอย่าง:{" "}
                  {formatCurrency(
                    formSettings.electricRatePerUnit,
                    formSettings.currency,
                  )}{" "}
                  ต่อ kWh
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <LabelWithInfo
                htmlFor="taxRate"
                tooltip="อัตราภาษีมูลค่าเพิ่ม (VAT) ที่คิดจากยอดรวมย่อย เช่น 7% คือเพิ่มภาษี 7% จากยอดรวมย่อย"
              >
                อัตราภาษี (%)
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
            <CardTitle>ข้อมูลบริษัท/หอพัก</CardTitle>
            <CardDescription>ข้อมูลที่จะปรากฏบนใบแจ้งหนี้</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LabelWithInfo
                htmlFor="companyName"
                tooltip="ชื่อบริษัทหรือองค์กรที่จะแสดงบนใบแจ้งหนี้"
              >
                ชื่อบริษัท
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
                tooltip="ที่อยู่บริษัทที่จะแสดงบนใบแจ้งหนี้"
              >
                ที่อยู่
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
                  tooltip="เบอร์โทรบริษัทสำหรับติดต่อบนใบแจ้งหนี้"
                >
                  โทรศัพท์
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
                  tooltip="อีเมลสำหรับติดต่อเรื่องการชำระเงิน"
                >
                  อีเมล
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
            <CardTitle>ตั้งค่าใบแจ้งหนี้</CardTitle>
            <CardDescription>
              กำหนดตัวเลือกการสร้างใบแจ้งหนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">คำนำหน้าเลขที่ใบแจ้งหนี้</Label>
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
                  tooltip="จำนวนวันนับจากวันที่ออกบิลจนถึงวันครบกำหนด ใช้เป็นค่าตั้งต้นหากไม่ได้กำหนดวันครบกำหนดรายเดือน"
                >
                  กำหนดชำระ (วัน)
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
                tooltip="รหัสสกุลเงินที่ใช้กับค่าทางการเงินทั้งหมด (เช่น THB, USD)"
              >
                สกุลเงิน
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
            <CardTitle>ข้อมูลการชำระเงิน</CardTitle>
            <CardDescription>
              ข้อมูลธนาคารและคำแนะนำการชำระเงินบนใบแจ้งหนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="bankName"
                  tooltip="ชื่อธนาคารที่รับชำระเงิน จะแสดงบนใบแจ้งหนี้เป็น 'ชำระเงินได้ที่ [ชื่อธนาคาร]'"
                >
                  ชื่อธนาคาร
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
                  tooltip="เลขที่บัญชีสำหรับรับชำระเงิน จะแสดงต่อจากชื่อธนาคารบนใบแจ้งหนี้"
                >
                  เลขที่บัญชีธนาคาร
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
                  tooltip="LINE ID สำหรับติดต่อเรื่องการชำระเงิน จะแสดงบนใบแจ้งหนี้เป็นบรรทัด 'ไอดีไลน์ [Line ID]'"
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
                  tooltip="กำหนดวันครบกำหนดรายเดือน (1-31) เช่น 5 คือครบกำหนดวันที่ 5 ของทุกเดือน และจะทับค่ากำหนดชำระเป็นวัน"
                >
                  วันครบกำหนดรายเดือน
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
                  วันที่ครบกำหนดชำระในแต่ละเดือน (เช่น 5 = วันที่ 5 ของทุกเดือน)
                </p>
              </div>
            </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="latePaymentPenaltyPerDay"
                  tooltip="ค่าปรับรายวันที่คิดเมื่อชำระเกินกำหนด จะแสดงบนใบแจ้งหนี้เป็น 'หากเกินกำหนด ชำระค่าปรับวันละ [จำนวนเงิน]'. ตั้งค่า 0 เพื่อปิด"
                >
                  ค่าปรับชำระล่าช้า (ต่อวัน)
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
                จำนวนค่าปรับต่อวันสำหรับการชำระล่าช้า (0 เพื่อปิด)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thai Labels (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>ป้ายกำกับใบแจ้งหนี้ (ไทย)</CardTitle>
            <CardDescription>
              ปรับแต่งข้อความภาษาไทยบนใบแจ้งหนี้ (เว้นว่างเพื่อใช้ค่าเริ่มต้น)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="labelInvoice"
                  tooltip="ข้อความไทยสำหรับคำว่า 'ใบแจ้งหนี้' ที่แสดงด้านบนใบแจ้งหนี้ ค่าเริ่มต้น: 'ใบแจ้งหนี้'"
                >
                  หัวข้อใบแจ้งหนี้
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
                  tooltip="ข้อความไทยสำหรับ 'ค่าเช่าห้อง' ในตารางใบแจ้งหนี้ ค่าเริ่มต้น: 'ค่าเช่าห้อง'"
                >
                  ป้ายกำกับค่าเช่าห้อง
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
                  tooltip="ข้อความไทยสำหรับ 'ค่าน้ำประปา' ในตารางใบแจ้งหนี้ ค่าเริ่มต้น: 'ค่าน้ำประปา'"
                >
                  ป้ายกำกับค่าน้ำ
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
                <Label htmlFor="labelElectricity">ป้ายกำกับค่าไฟ</Label>
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
            <CardTitle>ค่าเริ่มต้นของห้อง</CardTitle>
            <CardDescription>ใช้เมื่อสร้างห้องใหม่</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="defaultRoomRent"
                  tooltip="ค่าเช่ารายเดือนเริ่มต้นเมื่อสร้างห้องใหม่ สามารถแก้ไขได้รายห้อง"
                >
                  ค่าเช่ารายเดือนเริ่มต้น
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
                  tooltip="ขนาดห้องเริ่มต้น (ตร.ม.) เมื่อสร้างห้องใหม่ สามารถแก้ไขได้รายห้อง"
                >
                  ขนาดห้องเริ่มต้น (ตร.ม.)
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
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                บันทึก Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
