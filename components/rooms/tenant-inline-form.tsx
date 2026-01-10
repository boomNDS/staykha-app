import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantDraft } from "@/lib/types";

interface TenantInlineFormProps {
  value: TenantDraft;
  onChange: (next: TenantDraft) => void;
  showDeposit?: boolean;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function TenantInlineForm({
  value,
  onChange,
  showDeposit = false,
  errors = {},
  disabled = false,
}: TenantInlineFormProps) {
  const update = (patch: Partial<TenantDraft>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="tenantName">ชื่อ-นามสกุล</Label>
        <Input
          id="tenantName"
          value={value.name}
          onChange={(e) => update({ name: e.target.value })}
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenantEmail">อีเมล</Label>
        <Input
          id="tenantEmail"
          type="email"
          value={value.email}
          onChange={(e) => update({ email: e.target.value })}
          disabled={disabled}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenantPhone">โทรศัพท์</Label>
        <Input
          id="tenantPhone"
          value={value.phone}
          onChange={(e) => update({ phone: e.target.value })}
          disabled={disabled}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>
      <div className={showDeposit ? "space-y-2" : "space-y-2 sm:col-span-2"}>
        <Label htmlFor="tenantMoveIn">วันที่ย้ายเข้า</Label>
        <Input
          id="tenantMoveIn"
          type="date"
          value={value.moveInDate}
          onChange={(e) => update({ moveInDate: e.target.value })}
          disabled={disabled}
        />
        {errors.moveInDate && (
          <p className="text-sm text-destructive">{errors.moveInDate}</p>
        )}
      </div>
      {showDeposit && (
        <div className="space-y-2">
          <Label htmlFor="tenantDeposit">เงินประกัน</Label>
          <Input
            id="tenantDeposit"
            type="number"
            min="0"
            value={value.deposit ?? ""}
            onChange={(e) => update({ deposit: e.target.value })}
            disabled={disabled}
          />
          {errors.deposit && (
            <p className="text-sm text-destructive">{errors.deposit}</p>
          )}
        </div>
      )}
    </div>
  );
}
