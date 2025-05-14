import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LEAD_STAGES, LEAD_TAGS, LEAD_SOURCES } from '@/contexts/CRMContext';
import type { LeadType } from '@/hooks/useLeads';

// Create schema for the form using zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  source: z.string().optional(),
  stage: z.string().default(LEAD_STAGES.NEW),
  tag: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadFormProps {
  lead?: LeadType;
  onSubmit: (data: Partial<LeadType>) => void;
  isSubmitting: boolean;
}

export function LeadForm({ lead, onSubmit, isSubmitting }: LeadFormProps) {
  // Initialize form with default values or existing lead data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: lead?.name || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      source: lead?.source || '',
      stage: lead?.stage || LEAD_STAGES.NEW,
      tag: lead?.tag || '',
      notes: lead?.notes || '',
      followUpDate: lead?.followUpDate ? new Date(lead.followUpDate) : null,
    },
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    // Convert Date object to string for followUpDate if it exists
    const leadData: Partial<LeadType> = {
      ...values,
      followUpDate: values.followUpDate ? values.followUpDate.toISOString() : null
    };
    onSubmit(leadData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Tag</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEAD_TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LEAD_STAGES).map(([key, value]) => {
                      // Format the stage label: "NEW" -> "New", "IN_DISCUSSION" -> "In Discussion"
                      const formattedLabel = key === 'NEW' ? 'New' : 
                                           key === 'IN_DISCUSSION' ? 'In Discussion' :
                                           key === 'WON' ? 'Won' : 'Lost';
                      
                      return (
                        <SelectItem key={value} value={value}>
                          {formattedLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Follow-up Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this lead..." 
                  className="min-h-[120px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : lead ? 'Update Lead' : 'Add Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
}