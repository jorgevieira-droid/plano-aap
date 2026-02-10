import { useInstrumentFields, InstrumentField } from '@/hooks/useInstrumentFields';
import { RatingScale } from './RatingScale';
import { RubricAccordion } from './RubricAccordion';
import { DimensionBlock } from './DimensionBlock';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface InstrumentFormProps {
  formType: string;
  responses: Record<string, any>;
  onResponseChange: (fieldKey: string, value: any) => void;
  selectedKeys?: string[];
  readOnly?: boolean;
}

export function InstrumentForm({ formType, responses, onResponseChange, selectedKeys, readOnly }: InstrumentFormProps) {
  const { fields, groupedByDimension, isLoading } = useInstrumentFields(formType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (fields.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Nenhum campo configurado para este instrumento.</p>;
  }

  // Filter by selectedKeys if provided
  const visibleFields = selectedKeys
    ? fields.filter(f => selectedKeys.includes(f.field_key))
    : fields;

  // Regroup visible fields
  const groups = visibleFields.reduce<Record<string, InstrumentField[]>>((acc, field) => {
    const dim = field.dimension || '__no_dimension__';
    if (!acc[dim]) acc[dim] = [];
    acc[dim].push(field);
    return acc;
  }, {});

  const dimensionOrder = Object.keys(groups);

  return (
    <div className="space-y-5">
      {dimensionOrder.map(dim => {
        const fieldsInDim = groups[dim];
        const content = fieldsInDim.map(field => (
          <FieldRenderer
            key={field.field_key}
            field={field}
            value={responses[field.field_key]}
            onChange={(val) => onResponseChange(field.field_key, val)}
            readOnly={readOnly}
          />
        ));

        if (dim === '__no_dimension__') {
          return <div key={dim} className="space-y-5">{content}</div>;
        }

        return (
          <DimensionBlock key={dim} title={dim}>
            {content}
          </DimensionBlock>
        );
      })}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: InstrumentField;
  value: any;
  onChange: (val: any) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">
          {field.label}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
        )}
      </div>

      {field.field_type === 'rating' && (
        <>
          <RatingScale
            min={field.scale_min || 1}
            max={field.scale_max || 4}
            value={value as number | undefined}
            onChange={onChange}
            scaleLabels={field.scale_labels}
            readOnly={readOnly}
          />
          {field.scale_labels && field.scale_labels.some(s => s.description) && (
            <RubricAccordion fieldKey={field.field_key} scaleLabels={field.scale_labels} />
          )}
        </>
      )}

      {field.field_type === 'text' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${field.label}...`}
          rows={3}
          disabled={readOnly}
        />
      )}

      {field.field_type === 'number' && (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={readOnly}
          className="w-32"
        />
      )}

      {field.field_type === 'select_one' && field.metadata?.options && (
        <RadioGroup
          value={value || ''}
          onValueChange={onChange}
          disabled={readOnly}
          className="flex flex-wrap gap-3"
        >
          {(field.metadata.options as string[]).map(opt => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${field.field_key}_${opt}`} />
              <Label htmlFor={`${field.field_key}_${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.field_type === 'select_multi' && field.metadata?.options && (
        <div className="space-y-2">
          {(field.metadata.options as string[]).map(opt => {
            const selected = Array.isArray(value) ? value.includes(opt) : false;
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  checked={selected}
                  disabled={readOnly}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...current, opt]);
                    } else {
                      onChange(current.filter((v: string) => v !== opt));
                    }
                  }}
                />
                <span className="text-sm">{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
