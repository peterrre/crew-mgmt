'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

const shiftSchema = z.object({
  title: z.string().min(1),
  startOffset: z.number().min(0),
  endOffset: z.number().min(0),
  recurrence: z.string().optional(),
})

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  defaultShifts: z.array(shiftSchema),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateBuilderProps {
  initialData?: Partial<TemplateFormData>
  onSubmit: (data: FormData) => void
  submitLabel: string
}

export function TemplateBuilder({ initialData, onSubmit, submitLabel }: TemplateBuilderProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || { defaultShifts: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'defaultShifts',
  })

  const handleFormSubmit = (data: TemplateFormData) => {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    formData.append('defaultShifts', JSON.stringify(data.defaultShifts))
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Default Shifts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: '', startOffset: 0, endOffset: 1, recurrence: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Shift {index + 1}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input {...register(`defaultShifts.${index}.title`)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Offset (hours from event start)</Label>
                    <Input
                      type="number"
                      {...register(`defaultShifts.${index}.startOffset`, { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>End Offset (hours from event start)</Label>
                    <Input
                      type="number"
                      {...register(`defaultShifts.${index}.endOffset`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Recurrence (optional)</Label>
                  <Input {...register(`defaultShifts.${index}.recurrence`)} placeholder="e.g., weekly" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No shifts defined. Add some shifts to get started.
          </div>
        )}
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}