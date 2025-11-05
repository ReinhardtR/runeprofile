"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { z } from "zod";

import {
  AchievementDiaryTierCompletedEventSchema,
  ActivityEvent,
  ActivityEventType,
  CombatAchievementTierCompletedEventSchema,
  LevelUpEventSchema,
  MaxedEventSchema,
  NewItemObtainedEventSchema,
  QuestCompletedEventSchema,
  ValuableDropEventSchema,
  XpMilestoneEventSchema,
} from "@runeprofile/runescape";

const ActivitySchemas = {
  [ActivityEventType.LEVEL_UP]: LevelUpEventSchema,
  [ActivityEventType.NEW_ITEM_OBTAINED]: NewItemObtainedEventSchema,
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]:
    AchievementDiaryTierCompletedEventSchema,
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]:
    CombatAchievementTierCompletedEventSchema,
  [ActivityEventType.QUEST_COMPLETED]: QuestCompletedEventSchema,
  [ActivityEventType.MAXED]: MaxedEventSchema,
  [ActivityEventType.XP_MILESTONE]: XpMilestoneEventSchema,
  [ActivityEventType.VALUABLE_DROP]: ValuableDropEventSchema,
} as const;

interface DynamicActivityFormProps {
  initialData?: ActivityEvent;
  onSubmit: (data: ActivityEvent) => Promise<void>;
  isLoading: boolean;
  submitText: string;
}

export function DynamicActivityForm({
  initialData,
  onSubmit,
  isLoading,
  submitText,
}: DynamicActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityEvent["type"]>(
    initialData?.type || ActivityEventType.LEVEL_UP,
  );
  const [formData, setFormData] = useState<Record<string, unknown>>(
    initialData?.data || {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data when activity type changes
  useEffect(() => {
    if (!initialData || activityType !== initialData.type) {
      setFormData({});
      setErrors({});
    }
  }, [activityType, initialData]);

  // Get the schema for the current activity type
  const currentSchema = ActivitySchemas[activityType];
  const dataSchema = currentSchema.shape.data;

  // Extract field definitions from the schema
  const getFieldDefinitions = (
    schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
  ) => {
    const fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }> = [];

    const shape = schema.shape;
    for (const [fieldName, fieldSchema] of Object.entries(shape)) {
      let type = "text";
      let required = true;

      if (fieldSchema instanceof z.ZodNumber) {
        type = "number";
      } else if (fieldSchema instanceof z.ZodString) {
        type = "text";
      } else if (fieldSchema instanceof z.ZodOptional) {
        required = false;
        const innerType = fieldSchema.unwrap();
        if (innerType instanceof z.ZodNumber) {
          type = "number";
        }
      }

      fields.push({
        name: fieldName,
        type,
        required,
      });
    }

    return fields;
  };

  const fields = getFieldDefinitions(dataSchema);

  const handleFieldChange = (fieldName: string, value: string) => {
    const field = fields.find((f) => f.name === fieldName);
    let processedValue: string | number | undefined = value;

    // Convert to appropriate type
    if (field?.type === "number") {
      processedValue = value === "" ? undefined : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: processedValue,
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      // Validate the complete activity event
      const activityData = {
        type: activityType,
        data: formData,
      };

      currentSchema.parse(activityData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          // Remove "data." prefix from path for display
          const fieldPath = path.startsWith("data.") ? path.slice(5) : path;
          newErrors[fieldPath] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const activityData = {
      type: activityType,
      data: formData,
    } as ActivityEvent;

    await onSubmit(activityData);
  };

  const getFieldLabel = (fieldName: string) => {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  const getActivityTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activityType">Activity Type</Label>
        <Select
          value={activityType}
          onValueChange={(value) =>
            setActivityType(value as ActivityEvent["type"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ActivityEventType).map((type) => (
              <SelectItem key={type} value={type}>
                {getActivityTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Activity Data</h4>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={field.name}>
                    {getFieldLabel(field.name)}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={String(formData[field.name] ?? "")}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    placeholder={`Enter ${getFieldLabel(field.name).toLowerCase()}`}
                    className={errors[field.name] ? "border-red-500" : ""}
                  />
                  {errors[field.name] && (
                    <p className="text-sm text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            This activity type doesn&apos;t require additional data.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : submitText}
        </Button>
      </div>
    </form>
  );
}
