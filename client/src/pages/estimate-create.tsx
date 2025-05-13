import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Calculator,
  SquarePen,
  Building,
  User,
  CircleDollarSign 
} from 'lucide-react';

// Create a schema for the form
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_id: z.number().optional().nullable(),
  lead_id: z.number().optional().nullable(),
  status: z.string().default("draft"),
  configJSON: z.any().optional(),
  subtotal: z.number().default(0),
  gst: z.number().default(0),
  total: z.number().default(0),
  isTemplate: z.boolean().default(false),
  templateName: z.string().optional(),
});

type EstimateFormValues = z.infer<typeof formSchema>;

export default function CreateEstimatePage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Get clients and leads for dropdown selection
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/clients');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
      }
    }
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/leads');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching leads:", error);
        return [];
      }
    }
  });

  // Get estimate configurations
  const { data: estimateConfigs = [] } = useQuery({
    queryKey: ['/api/estimate-configs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/estimate-configs/active');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching estimate configurations:", error);
        return [];
      }
    }
  });

  // Setup form with default values
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "New Estimate",
      client_id: null,
      lead_id: null,
      status: "draft",
      configJSON: {},
      subtotal: 0,
      gst: 0,
      total: 0,
      isTemplate: false,
      templateName: "",
    }
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormValues) => {
      const response = await apiRequest('POST', '/api/estimates', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      toast({
        title: "Estimate created",
        description: "Your estimate has been created successfully.",
      });
      navigate(`/estimates/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Submit handler
  const onSubmit = (values: EstimateFormValues) => {
    createEstimateMutation.mutate(values);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/estimates')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create New Estimate</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimate Details</CardTitle>
          <CardDescription>Enter the basic information for this estimate</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimate Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter estimate title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
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
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead: any) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.name}
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
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Save as Template</FormLabel>
                        <FormDescription>
                          This will save the estimate as a reusable template
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('isTemplate') && (
                <FormField
                  control={form.control}
                  name="templateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/estimates')}
                  disabled={createEstimateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createEstimateMutation.isPending}
                >
                  {createEstimateMutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Estimate
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}