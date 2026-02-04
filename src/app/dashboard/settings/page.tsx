"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import * as React from "react";
import { AdminRestrictionBanner } from "@/components/admin-restriction-banner";
import { BankLogo, BANK_OPTIONS } from "@/components/bank-logo";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dropzone,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneTrigger,
  DropZoneArea,
  useDropzone,
} from "@/components/dropzone";
import { getData } from "@/lib/api/response-helpers";
import { useToast } from "@/hooks/use-toast";
import { importsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-hooks";
import { useSettings } from "@/lib/hooks/use-settings";
import { useTeam } from "@/lib/hooks/use-team";
import { useSearchParams } from "@/lib/router";
import { useRouter } from "@/lib/router";
import type { AdminSettings } from "@/lib/types";
import { WaterBillingMode } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";
import type { ImportErrorDetail } from "@/lib/api/services/imports-types";

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
              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings, isLoading, updateSettings } = useSettings();
  const { team, isUpdating: isSavingTeam, updateTeam } = useTeam();
  const [isSaving, setIsSaving] = React.useState(false);
  const [promptpayErrors, setPromptpayErrors] = React.useState<{
    type?: string;
    id?: string;
  }>({});
  const [teamName, setTeamName] = React.useState("");
  const [importMode, setImportMode] = React.useState<"excel" | "csv">("excel");
  const [excelFile, setExcelFile] = React.useState<File | null>(null);
  const [buildingsFile, setBuildingsFile] = React.useState<File | null>(null);
  const [roomsFile, setRoomsFile] = React.useState<File | null>(null);
  const [tenantsFile, setTenantsFile] = React.useState<File | null>(null);
  const [createOnly, setCreateOnly] = React.useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = React.useState(false);
  const [demoLang, setDemoLang] = React.useState<"th" | "en">("th");
  const [demoFormat, setDemoFormat] = React.useState<"xlsx" | "csv">("xlsx");
  const [demoSheet, setDemoSheet] = React.useState<
    "buildings" | "rooms" | "tenants"
  >("buildings");
  const [importErrors, setImportErrors] = React.useState<ImportErrorDetail[]>(
    [],
  );
  const [importResult, setImportResult] = React.useState<{
    buildingsCreated: number;
    buildingsUpdated?: number;
    roomsCreated: number;
    roomsUpdated?: number;
    tenantsCreated: number;
    tenantsUpdated?: number;
  } | null>(null);

  const downloadDemoMutation = useMutation({
    mutationFn: (options: {
      lang: "th" | "en";
      format: "xlsx" | "csv";
      sheet: "buildings" | "rooms" | "tenants";
    }) => importsApi.downloadDemo(options),
    onSuccess: (blob, variables) => {
      const suffix =
        variables.format === "csv" ? `-${variables.sheet}` : "";
      const name = `staykha-import-demo-${variables.lang}${suffix}.${variables.format}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast({
        title: "ดาวน์โหลดไม่สำเร็จ",
        description: error?.message || "ไม่สามารถดาวน์โหลดไฟล์ตัวอย่างได้",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: ({
      formData,
      mode,
    }: {
      formData: FormData;
      mode: "upsert" | "create";
    }) => importsApi.importOwner(formData, { mode }),
    onSuccess: (response) => {
      const stats = response?.data;
      if (!stats) {
        throw new Error("ไม่พบข้อมูลสรุปการนำเข้า");
      }
      setImportErrors([]);
      setImportResult(stats);
      const summary = [
        `เพิ่มอาคาร ${stats.buildingsCreated}`,
        stats.buildingsUpdated ? `อัปเดตอาคาร ${stats.buildingsUpdated}` : null,
        `ห้อง ${stats.roomsCreated}`,
        stats.roomsUpdated ? `อัปเดตห้อง ${stats.roomsUpdated}` : null,
        `ผู้เช่า ${stats.tenantsCreated}`,
        stats.tenantsUpdated ? `อัปเดตผู้เช่า ${stats.tenantsUpdated}` : null,
      ]
        .filter(Boolean)
        .join(" • ");
      toast({
        title: "นำเข้าสำเร็จ",
        description: summary,
      });
      router.push("/overview");
    },
    onError: (error: any) => {
      setImportResult(null);
      const original = error?.originalError;
      const errorData = original?.data?.data?.errors ?? original?.data?.errors;
      if (Array.isArray(errorData)) {
        setImportErrors(errorData);
      }
      toast({
        title: "นำเข้าไม่สำเร็จ",
        description: error?.message || "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive",
      });
    },
  });

  // Initialize form state with settings
  const [formSettings, setFormSettings] = React.useState<AdminSettings>({
    teamId: user?.teamId || "",
    waterRatePerUnit: 25,
    waterBillingMode: WaterBillingMode.METERED,
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
    promptpayEnabled: false,
    promptpayType: "PHONE",
    promptpayId: "",
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

  React.useEffect(() => {
    const section = searchParams.get("section");
    if (section !== "import") return;
    const element = document.getElementById("import");
    if (!element) return;
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams]);

  React.useEffect(() => {
    if (importMode === "excel") {
      setBuildingsFile(null);
      setRoomsFile(null);
      setTenantsFile(null);
    } else {
      setExcelFile(null);
    }
    setImportErrors([]);
    setImportResult(null);
  }, [importMode]);

  React.useEffect(() => {
    if (demoFormat === "xlsx") {
      setDemoSheet("buildings");
    }
  }, [demoFormat]);

  const excelDropzone = useDropzone({
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    multiple: false,
    onFilesChange: (files) => setExcelFile(files[0] ?? null),
  });

  const buildingsDropzone = useDropzone({
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    multiple: false,
    onFilesChange: (files) => setBuildingsFile(files[0] ?? null),
  });

  const roomsDropzone = useDropzone({
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    multiple: false,
    onFilesChange: (files) => setRoomsFile(files[0] ?? null),
  });

  const tenantsDropzone = useDropzone({
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    multiple: false,
    onFilesChange: (files) => setTenantsFile(files[0] ?? null),
  });

  const handleSave = async () => {
    setIsSaving(true);
    setPromptpayErrors({});
    try {
      // Ensure teamId is set
      const teamId = formSettings.teamId || user?.teamId || "";
      if (!teamId) {
        throw new Error("ไม่พบข้อมูลทีม");
      }

      const baseSettings = settings ?? ({} as AdminSettings);
      const settingsToSave = Object.keys(formSettings).reduce(
        (acc, key) => {
          const typedKey = key as keyof AdminSettings;
          if (typedKey === "teamId" || typedKey === "team") return acc;
          const nextValue = formSettings[typedKey];
          const prevValue = baseSettings[typedKey];
          if (nextValue !== prevValue) {
            acc[typedKey] = nextValue as never;
          }
          return acc;
        },
        {} as Partial<AdminSettings>,
      );

      if (settingsToSave.promptpayEnabled === true) {
        settingsToSave.promptpayType =
          formSettings.promptpayType || "PHONE";
        settingsToSave.promptpayId = formSettings.promptpayId || "";
      }

      if (settingsToSave.promptpayEnabled === false) {
        delete settingsToSave.promptpayType;
        delete settingsToSave.promptpayId;
      }

      // GET /v1/settings auto-creates defaults if they don't exist,
      // so we can always use PATCH to update
      // If settings is null, we'll initialize first, then update
      if (!settings) {
        if (import.meta.env.DEV) {
          console.log("[Settings] Initializing settings first, then updating");
        }
        // Initialize to ensure settings exist
        await settingsApi.initialize();
        // Invalidate to refetch the newly created settings
        await queryClient.invalidateQueries({ queryKey: ["settings", teamId] });
      }

      if (import.meta.env.DEV) {
        console.log("[Settings] Updating settings:", settingsToSave);
      }
      const updatedResponse = await updateSettings(settingsToSave);
      const updatedSettings = getData(updatedResponse);
      if (updatedSettings) {
        setFormSettings({
          ...updatedSettings,
          teamId: updatedSettings.teamId || teamId,
        });
      }
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึก Settings เรียบร้อย",
      });
    } catch (error: any) {
      console.error("Settings save error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save settings";
      if (errorMessage === "promptpayId required") {
        setPromptpayErrors((prev) => ({
          ...prev,
          id: "กรุณากรอกเลขพร้อมเพย์",
        }));
      }
      if (errorMessage === "invalid promptpayType") {
        setPromptpayErrors((prev) => ({
          ...prev,
          type: "ประเภทพร้อมเพย์ไม่ถูกต้อง",
        }));
      }
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

  const validateImport = () => {
    if (importMode === "excel") {
      if (!excelFile) {
        toast({
          title: "กรุณาเลือกไฟล์",
          description: "ต้องอัปโหลดไฟล์ Excel (.xlsx/.xls) ก่อนนำเข้า",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }

    if (!buildingsFile || !roomsFile) {
      toast({
        title: "กรุณาเลือกไฟล์",
        description: "ต้องอัปโหลดไฟล์ Buildings และ Rooms เป็นอย่างน้อย",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const submitImport = () => {
    const formData = new FormData();
    if (importMode === "excel" && excelFile) {
      formData.append("file", excelFile);
    } else {
      if (buildingsFile) {
        formData.append("buildingsFile", buildingsFile);
      }
      if (roomsFile) {
        formData.append("roomsFile", roomsFile);
      }
      if (tenantsFile) {
        formData.append("tenantsFile", tenantsFile);
      }
    }

    importMutation.mutate({
      formData,
      mode: createOnly ? "create" : "upsert",
    });
  };

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportErrors([]);
    setImportResult(null);

    if (!validateImport()) return;

    setConfirmImportOpen(true);
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
        <Card id="import">
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
      <PageHeader title="Settings" description="จัดการอัตราค่าบริการและข้อมูลบริษัท" />

      <div className="space-y-6">
        {/* Team Management (Owner Only) */}
        {user?.role === "owner" && team && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลทีม</CardTitle>
              <CardDescription>จัดการชื่อทีม/องค์กรของคุณ</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>นำเข้าข้อมูลเริ่มต้น</CardTitle>
            <CardDescription>
              ดาวน์โหลดไฟล์ตัวอย่างและอัปโหลดข้อมูลอาคาร ห้อง และผู้เช่าเพื่อเริ่มต้นได้เร็วขึ้น
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user?.role !== "owner" ? (
              <AdminRestrictionBanner
                title="เฉพาะเจ้าของเท่านั้น"
                message="ฟีเจอร์นำเข้าข้อมูลใช้ได้เฉพาะเจ้าของทีม"
              />
            ) : (
              <>
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          ไฟล์ตัวอย่างการนำเข้า
                        </p>
                        <p className="text-xs text-muted-foreground">
                          เลือกภาษาและรูปแบบไฟล์ก่อนดาวน์โหลด
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          downloadDemoMutation.mutate({
                            lang: demoLang,
                            format: demoFormat,
                            sheet: demoFormat === "csv" ? demoSheet : "buildings",
                          })
                        }
                        disabled={downloadDemoMutation.isPending}
                      >
                        {downloadDemoMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังดาวน์โหลด...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            ดาวน์โหลดไฟล์ตัวอย่าง
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="demoLang">ภาษา</Label>
                        <Select
                          value={demoLang}
                          onValueChange={(value) =>
                            setDemoLang(value as "th" | "en")
                          }
                        >
                          <SelectTrigger id="demoLang">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="th">ไทย (ค่าเริ่มต้น)</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="demoFormat">รูปแบบ</Label>
                        <Select
                          value={demoFormat}
                          onValueChange={(value) =>
                            setDemoFormat(value as "xlsx" | "csv")
                          }
                        >
                          <SelectTrigger id="demoFormat">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="demoSheet">ชีต</Label>
                        <Select
                          value={demoSheet}
                          onValueChange={(value) =>
                            setDemoSheet(
                              value as "buildings" | "rooms" | "tenants",
                            )
                          }
                          disabled={demoFormat !== "csv"}
                        >
                          <SelectTrigger id="demoSheet">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buildings">Buildings</SelectItem>
                            <SelectItem value="rooms">Rooms</SelectItem>
                            <SelectItem value="tenants">Tenants</SelectItem>
                          </SelectContent>
                        </Select>
                        {demoFormat !== "csv" && (
                          <p className="text-xs text-muted-foreground">
                            ใช้ได้เฉพาะเมื่อเลือก CSV
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <Tabs
                    value={importMode}
                    onValueChange={(value) =>
                      setImportMode(value as "excel" | "csv")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="excel" className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </TabsTrigger>
                      <TabsTrigger value="csv" className="gap-2">
                        CSV
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="excel" className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="excelFile">ไฟล์ Excel</Label>
                        <Dropzone {...excelDropzone}>
                          <DropZoneArea>
                            <DropzoneTrigger>อัปโหลดไฟล์ Excel</DropzoneTrigger>
                          </DropZoneArea>
                          <DropzoneMessage />
                          {excelDropzone.files.length > 0 && (
                            <DropzoneFileList>
                              {excelDropzone.files.map((file, index) => (
                                <DropzoneFileListItem
                                  key={`${file.name}-${index}`}
                                  file={file}
                                  index={index}
                                />
                              ))}
                            </DropzoneFileList>
                          )}
                        </Dropzone>
                        <p className="text-xs text-muted-foreground">
                          รองรับไฟล์ .xlsx และ .xls เพียงไฟล์เดียว
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="csv" className="space-y-3">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="buildingsFile">Buildings CSV</Label>
                          <Dropzone {...buildingsDropzone}>
                            <DropZoneArea>
                              <DropzoneTrigger>
                                อัปโหลด Buildings CSV
                              </DropzoneTrigger>
                            </DropZoneArea>
                            <DropzoneMessage />
                            {buildingsDropzone.files.length > 0 && (
                              <DropzoneFileList>
                                {buildingsDropzone.files.map((file, index) => (
                                  <DropzoneFileListItem
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    index={index}
                                  />
                                ))}
                              </DropzoneFileList>
                            )}
                          </Dropzone>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roomsFile">Rooms CSV</Label>
                          <Dropzone {...roomsDropzone}>
                            <DropZoneArea>
                              <DropzoneTrigger>อัปโหลด Rooms CSV</DropzoneTrigger>
                            </DropZoneArea>
                            <DropzoneMessage />
                            {roomsDropzone.files.length > 0 && (
                              <DropzoneFileList>
                                {roomsDropzone.files.map((file, index) => (
                                  <DropzoneFileListItem
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    index={index}
                                  />
                                ))}
                              </DropzoneFileList>
                            )}
                          </Dropzone>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="tenantsFile">Tenants CSV (ถ้ามี)</Label>
                          <Dropzone {...tenantsDropzone}>
                            <DropZoneArea>
                              <DropzoneTrigger>
                                อัปโหลด Tenants CSV (ถ้ามี)
                              </DropzoneTrigger>
                            </DropZoneArea>
                            <DropzoneMessage />
                            {tenantsDropzone.files.length > 0 && (
                              <DropzoneFileList>
                                {tenantsDropzone.files.map((file, index) => (
                                  <DropzoneFileListItem
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    index={index}
                                  />
                                ))}
                              </DropzoneFileList>
                            )}
                          </Dropzone>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ต้องอัปโหลด Buildings และ Rooms อย่างน้อย 2 ไฟล์
                      </p>
                    </TabsContent>
                  </Tabs>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        checked={createOnly}
                        onChange={(event) => setCreateOnly(event.target.checked)}
                      />
                      ห้ามทับข้อมูลเดิม (Create-only)
                    </label>
                    <Button
                      type="submit"
                      disabled={importMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังนำเข้า...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        นำเข้าข้อมูล
                      </>
                    )}
                    </Button>
                  </div>
                </form>

                {importResult && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">สรุปการนำเข้า</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">อาคาร</p>
                        <p className="font-semibold text-foreground">
                          เพิ่ม {importResult.buildingsCreated}
                          {importResult.buildingsUpdated
                            ? ` • อัปเดต ${importResult.buildingsUpdated}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ห้อง</p>
                        <p className="font-semibold text-foreground">
                          เพิ่ม {importResult.roomsCreated}
                          {importResult.roomsUpdated
                            ? ` • อัปเดต ${importResult.roomsUpdated}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ผู้เช่า</p>
                        <p className="font-semibold text-foreground">
                          เพิ่ม {importResult.tenantsCreated}
                          {importResult.tenantsUpdated
                            ? ` • อัปเดต ${importResult.tenantsUpdated}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {importErrors.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                    <p className="mb-3 text-sm font-semibold text-destructive">
                      พบข้อผิดพลาด {importErrors.length} รายการ
                    </p>
                    <div className="space-y-2">
                      {importErrors.map((item, index) => (
                        <div
                          key={`${item.sheet}-${item.row}-${item.field ?? "row"}-${index}`}
                          className="rounded-md border border-destructive/20 bg-background px-3 py-2 text-xs text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">
                            {item.sheet} แถว {item.row}
                          </span>
                          {item.field ? ` • ${item.field}` : ""} — {item.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>ตั้งค่า LINE OA</CardTitle>
              <CardDescription>
                เชื่อมต่อ LINE Official Account เพื่อส่งข้อความถึงผู้เช่า
              </CardDescription>
            </div>
            <Badge variant="outline">Coming soon</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ฟีเจอร์นี้กำลังพัฒนา จะรองรับการเชื่อมต่อ LINE OA และส่งข้อความอัตโนมัติ
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>LINE OA ID</Label>
                <Input disabled placeholder="ใส่ LINE OA ID" />
              </div>
              <div className="space-y-2">
                <Label>Channel Access Token</Label>
                <Input disabled placeholder="ใส่ Channel Access Token" />
              </div>
              <div className="space-y-2">
                <Label>Channel Secret</Label>
                <Input disabled placeholder="ใส่ Channel Secret" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled>
                บันทึกการเชื่อมต่อ
              </Button>
              <Button type="button" variant="outline" disabled>
                ส่งข้อความทดสอบ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Rates */}
        <Card>
          <CardHeader>
            <CardTitle>อัตราค่าบริการ</CardTitle>
            <CardDescription>กำหนดอัตราต่อหน่วยสำหรับค่าน้ำและค่าไฟ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="waterBillingMode"
                  tooltip="เลือกวิธีคิดค่าน้ำ: แบบมิเตอร์คิดตามจำนวนที่ใช้ (ยูนิต), แบบเหมาจ่ายคิดรายเดือนเท่ากันทุกเดือน"
                >
                  โหมดการคิดค่าน้ำ
                </LabelWithInfo>
                <Select
                  value={formSettings.waterBillingMode}
                  onValueChange={(value) =>
                    setFormSettings({
                      ...formSettings,
                      waterBillingMode: value as WaterBillingMode,
                    })
                  }
                >
                  <SelectTrigger id="waterBillingMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WaterBillingMode.METERED}>ตามมิเตอร์ (ต่อยูนิต)</SelectItem>
                    <SelectItem value={WaterBillingMode.FIXED}>เหมาจ่ายรายเดือน</SelectItem>
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
                    disabled={formSettings.waterBillingMode !== WaterBillingMode.FIXED}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formSettings.waterBillingMode === WaterBillingMode.FIXED
                    ? `คิดต่อเดือน: ${formatCurrency(formSettings.waterFixedFee, formSettings.currency)}`
                    : "เปลี่ยนเป็นเหมาจ่ายเพื่อใช้งาน"}
                </p>
              </div>
              <div className="space-y-2">
                <LabelWithInfo
                  htmlFor="waterRate"
                  tooltip="อัตราค่าน้ำต่อยูนิต ใช้เมื่อเลือกโหมด 'ตามมิเตอร์' เท่านั้น"
                >
                  อัตราค่าน้ำ (ต่อยูนิต)
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
                    disabled={formSettings.waterBillingMode === WaterBillingMode.FIXED}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ตัวอย่าง:{" "}
                  {formatCurrency(
                    formSettings.waterRatePerUnit,
                    formSettings.currency,
                  )}{" "}
                  ต่อยูนิต
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
            <CardDescription>กำหนดตัวเลือกการสร้างใบแจ้งหนี้</CardDescription>
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
                <Select
                  value={formSettings.bankName || ""}
                  onValueChange={(value) =>
                    setFormSettings({
                      ...formSettings,
                      bankName: value,
                    })
                  }
                >
                  <SelectTrigger id="bankName" className="h-11">
                    <div className="flex items-center gap-2">
                      {formSettings.bankName ? (
                        <>
                          <BankLogo name={formSettings.bankName} size="sm" />
                          <span>{formSettings.bankName}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">เลือกธนาคาร</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        <div className="flex items-center gap-2">
                          <BankLogo name={bank.value} size="sm" />
                          <span>{bank.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    เปิดใช้ PromptPay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    แสดง QR พร้อมเพย์บนใบแจ้งหนี้
                  </p>
                </div>
                <Switch
                  checked={Boolean(formSettings.promptpayEnabled)}
                  onCheckedChange={(checked) => {
                    setPromptpayErrors({});
                    setFormSettings({
                      ...formSettings,
                      promptpayEnabled: checked,
                      promptpayType: checked
                        ? formSettings.promptpayType || "PHONE"
                        : "PHONE",
                      promptpayId: checked ? formSettings.promptpayId : "",
                    });
                  }}
                />
              </div>
            </div>
            {formSettings.promptpayEnabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <LabelWithInfo
                    htmlFor="promptpayType"
                    tooltip="ประเภทพร้อมเพย์ที่จะแสดงบนใบแจ้งหนี้ (ใช้ร่วมกับเลขพร้อมเพย์)"
                  >
                    ประเภทพร้อมเพย์
                  </LabelWithInfo>
                  <Select
                    value={formSettings.promptpayType || "PHONE"}
                    onValueChange={(value) => {
                      setPromptpayErrors((prev) => ({ ...prev, type: undefined }));
                      setFormSettings({
                        ...formSettings,
                        promptpayType: value as AdminSettings["promptpayType"],
                      });
                    }}
                  >
                    <SelectTrigger id="promptpayType" className="h-11">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHONE">เบอร์โทรศัพท์</SelectItem>
                      <SelectItem value="NATIONAL_ID">เลขบัตรประชาชน</SelectItem>
                      <SelectItem value="EWALLET">กระเป๋าเงินอิเล็กทรอนิกส์</SelectItem>
                    </SelectContent>
                  </Select>
                  {promptpayErrors.type && (
                    <p className="text-xs text-destructive">
                      {promptpayErrors.type}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <LabelWithInfo
                    htmlFor="promptpayId"
                    tooltip="เลขพร้อมเพย์ ใช้สำหรับสร้าง QR Code ในใบแจ้งหนี้"
                  >
                    เลขพร้อมเพย์
                  </LabelWithInfo>
                  <Input
                    id="promptpayId"
                    value={formSettings.promptpayId || ""}
                    onChange={(e) => {
                      setPromptpayErrors((prev) => ({ ...prev, id: undefined }));
                      setFormSettings({
                        ...formSettings,
                        promptpayId: e.target.value,
                      });
                    }}
                    placeholder={
                      formSettings.promptpayType === "NATIONAL_ID"
                        ? "1-2345-67890-12-3"
                        : formSettings.promptpayType === "EWALLET"
                          ? "1234567890"
                          : "081-234-5678"
                    }
                  />
                  {promptpayErrors.id && (
                    <p className="text-xs text-destructive">
                      {promptpayErrors.id}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
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
                    latePaymentPenaltyPerDay:
                      Number.parseFloat(e.target.value) || 0,
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
      <ConfirmDialog
        open={confirmImportOpen}
        title="ยืนยันการนำเข้าข้อมูล"
        description={
          createOnly
            ? "ระบบจะสร้างเฉพาะรายการใหม่ หากพบข้อมูลเดิมจะไม่อัปเดต"
            : "ระบบจะอัปเดตข้อมูลเดิมและเพิ่มรายการใหม่ตามไฟล์ที่อัปโหลด"
        }
        confirmLabel="ยืนยันนำเข้า"
        cancelLabel="ยกเลิก"
        isLoading={importMutation.isPending}
        onConfirm={async () => {
          submitImport();
          setConfirmImportOpen(false);
        }}
        onOpenChange={(open) => setConfirmImportOpen(open)}
      />
    </div>
  );
}
