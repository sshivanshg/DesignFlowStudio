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
  CircleDollarSign,
  BrainCircuit,
  ArrowRightCircle,
  Loader2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Create a schema for the smart estimate form
const smartEstimateFormSchema = z.object({
  projectType: z.string().min(1, "Project type is required"),
  roomTypes: z.array(z.string()).min(1, "Select at least one room type"),
  squareFootage: z.number().min(1, "Square footage is required"),
  scope: z.string().min(10, "Provide a detailed project scope"),
  quality: z.string().min(1, "Quality level is required"),
  location: z.string().optional(),
  timeline: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  client_id: z.number().optional().nullable(),
  lead_id: z.number().optional().nullable(),
});

// Create a schema for the estimate final form
const finalEstimateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_id: z.number().optional().nullable(),
  lead_id: z.number().optional().nullable(),
  status: z.string().default("draft"),
  subtotal: z.number().min(0),
  gst: z.number().min(0),
  total: z.number().min(0),
  isTemplate: z.boolean().default(false),
  templateName: z.string().optional(),
  configJSON: z.any(),
  milestoneBreakdown: z.any(),
});

type SmartEstimateFormValues = z.infer<typeof smartEstimateFormSchema>;
type FinalEstimateValues = z.infer<typeof finalEstimateSchema>;

type SmartEstimateResponse = {
  totalEstimate: number;
  breakdown: {
    design: number;
    materials: number;
    labor: number;
    furniture: number;
    fixtures: number;
    accessories: number;
    management: number;
  };
  lineItems: Array<{
    category: string;
    name: string;
    description: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;
  timeEstimate: {
    designPhase: string;
    procurementPhase: string;
    implementationPhase: string;
    totalTimeframe: string;
  };
  recommendations: string[];
};

// Room type options
const roomTypeOptions = [
  { label: "Living Room", value: "living_room" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Primary Bedroom", value: "primary_bedroom" },
  { label: "Guest Bedroom", value: "guest_bedroom" },
  { label: "Dining Room", value: "dining_room" },
  { label: "Home Office", value: "home_office" },
  { label: "Basement", value: "basement" },
  { label: "Outdoor/Patio", value: "outdoor" },
  { label: "Entryway/Foyer", value: "entryway" },
  { label: "Hallway", value: "hallway" },
  { label: "Walk-in Closet", value: "closet" },
  { label: "Laundry Room", value: "laundry" },
  { label: "Media Room", value: "media_room" },
  { label: "Gym", value: "gym" },
  { label: "Playroom", value: "playroom" },
];

export default function AIEstimatePage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'processing' | 'review' | 'saving'>('input');
  const [progressValue, setProgressValue] = useState(0);
  const [aiEstimate, setAiEstimate] = useState<SmartEstimateResponse | null>(null);
  const [processingStatus, setProcessingStatus] = useState('Analyzing project requirements...');

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

  // Setup form with default values for AI estimate generation
  const smartEstimateForm = useForm<SmartEstimateFormValues>({
    resolver: zodResolver(smartEstimateFormSchema),
    defaultValues: {
      projectType: "residential",
      roomTypes: [],
      squareFootage: 0,
      scope: "",
      quality: "standard",
      location: "",
      timeline: "",
      title: "AI-Generated Estimate",
      client_id: null,
      lead_id: null,
    }
  });

  // Setup form for the final estimate
  const finalEstimateForm = useForm<FinalEstimateValues>({
    resolver: zodResolver(finalEstimateSchema),
    defaultValues: {
      title: "AI-Generated Estimate",
      client_id: null,
      lead_id: null,
      status: "draft",
      subtotal: 0,
      gst: 0,
      total: 0,
      isTemplate: false,
      configJSON: {},
      milestoneBreakdown: {
        milestone1: {
          percentage: 40,
          amount: 0,
          name: "Project Initiation"
        },
        milestone2: {
          percentage: 40,
          amount: 0,
          name: "Design Development"
        },
        milestone3: {
          percentage: 20,
          amount: 0,
          name: "Project Completion"
        }
      }
    }
  });

  // Mutation for generating AI estimate
  const generateAiEstimateMutation = useMutation({
    mutationFn: async (data: SmartEstimateFormValues) => {
      const response = await apiRequest('POST', '/api/estimates/ai-generate', {
        projectType: data.projectType,
        roomTypes: data.roomTypes,
        squareFootage: data.squareFootage,
        scope: data.scope,
        quality: data.quality,
        location: data.location || undefined,
        timeline: data.timeline || undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate AI estimate');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAiEstimate(data.data);
        prepareEstimateData(data.data);
        setStep('review');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate AI estimate. Please try again.",
          variant: "destructive",
        });
        setStep('input');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate AI estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setStep('input');
    }
  });

  // Mutation for creating estimate
  const createEstimateMutation = useMutation({
    mutationFn: async (data: FinalEstimateValues) => {
      const response = await apiRequest('POST', '/api/estimates', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      toast({
        title: "Estimate created",
        description: "Your AI-powered estimate has been created successfully.",
      });
      navigate(`/estimates/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
      setStep('review');
    }
  });

  // Handle initial form submission to generate AI estimate
  const onSubmitInitialForm = (data: SmartEstimateFormValues) => {
    setStep('processing');
    startProgressSimulation();
    
    // Make sure title, client_id, and lead_id are passed to the final form
    finalEstimateForm.setValue('title', data.title);
    finalEstimateForm.setValue('client_id', data.client_id);
    finalEstimateForm.setValue('lead_id', data.lead_id);
    
    // Generate the AI estimate
    generateAiEstimateMutation.mutate(data);
  };

  // Handle final form submission to create the estimate
  const onSubmitFinalForm = (data: FinalEstimateValues) => {
    setStep('saving');
    createEstimateMutation.mutate(data);
  };

  // Simulate progress for the AI processing
  const startProgressSimulation = () => {
    setProgressValue(0);
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        
        // Update processing status messages
        if (prev === 20) {
          setProcessingStatus('Analyzing similar projects and market rates...');
        } else if (prev === 40) {
          setProcessingStatus('Calculating materials and labor costs...');
        } else if (prev === 60) {
          setProcessingStatus('Generating detailed line items...');
        } else if (prev === 80) {
          setProcessingStatus('Preparing project recommendations...');
        }
        
        return prev + 1;
      });
    }, 300);
  };

  // Prepare the estimate data from the AI response
  const prepareEstimateData = (aiData: SmartEstimateResponse) => {
    // Prepare the configJSON data
    const configData = {
      aiGenerated: true,
      projectType: smartEstimateForm.getValues('projectType'),
      roomTypes: smartEstimateForm.getValues('roomTypes'),
      squareFootage: smartEstimateForm.getValues('squareFootage'),
      scope: smartEstimateForm.getValues('scope'),
      quality: smartEstimateForm.getValues('quality'),
      location: smartEstimateForm.getValues('location'),
      timeline: smartEstimateForm.getValues('timeline'),
      lineItems: aiData.lineItems,
      timeEstimate: aiData.timeEstimate,
      recommendations: aiData.recommendations,
      breakdown: aiData.breakdown
    };
    
    // Calculate milestone amounts based on total
    const milestone1Amount = aiData.totalEstimate * 0.4;
    const milestone2Amount = aiData.totalEstimate * 0.4;
    const milestone3Amount = aiData.totalEstimate * 0.2;
    
    // Update the final form with values from the AI estimate
    finalEstimateForm.setValue('subtotal', aiData.totalEstimate * 0.95); // Assuming 5% GST
    finalEstimateForm.setValue('gst', aiData.totalEstimate * 0.05);
    finalEstimateForm.setValue('total', aiData.totalEstimate);
    finalEstimateForm.setValue('configJSON', configData);
    finalEstimateForm.setValue('milestoneBreakdown', {
      milestone1: {
        percentage: 40,
        amount: milestone1Amount,
        name: "Project Initiation"
      },
      milestone2: {
        percentage: 40,
        amount: milestone2Amount,
        name: "Design Development"
      },
      milestone3: {
        percentage: 20,
        amount: milestone3Amount,
        name: "Project Completion"
      }
    });
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/estimates')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">AI-Powered Smart Estimate</h1>
      </div>

      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
              Generate AI Smart Estimate
            </CardTitle>
            <CardDescription>
              Our AI will analyze your project details and generate a comprehensive estimate with detailed line items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...smartEstimateForm}>
              <form onSubmit={smartEstimateForm.handleSubmit(onSubmitInitialForm)} className="space-y-6">
                {/* Basic Info Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={smartEstimateForm.control}
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
                      control={smartEstimateForm.control}
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
                      control={smartEstimateForm.control}
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
                  </div>
                </div>

                <Separator />

                {/* Project Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={smartEstimateForm.control}
                      name="projectType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="hospitality">Hospitality</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="office">Office</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smartEstimateForm.control}
                      name="squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter square footage"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smartEstimateForm.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quality level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="luxury">Luxury</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smartEstimateForm.control}
                      name="roomTypes"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Room Types</FormLabel>
                            <FormDescription>
                              Select all rooms included in this project
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {roomTypeOptions.map((option) => (
                              <FormField
                                key={option.value}
                                control={smartEstimateForm.control}
                                name="roomTypes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option.value}
                                      className="flex flex-row items-start space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            const updatedRoomTypes = checked
                                              ? [...field.value, option.value]
                                              : field.value?.filter(
                                                  (value) => value !== option.value
                                                );
                                            field.onChange(updatedRoomTypes);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {option.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <FormField
                      control={smartEstimateForm.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Scope</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the project scope in detail, including any special requirements or features..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Additional Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Details (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={smartEstimateForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City or region (e.g., San Francisco)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Helps with regional cost estimates
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smartEstimateForm.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired Timeline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3 months, by September" {...field} />
                          </FormControl>
                          <FormDescription>
                            When the project needs to be completed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/estimates')}
                    disabled={generateAiEstimateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={generateAiEstimateMutation.isPending}
                  >
                    {generateAiEstimateMutation.isPending ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Generate Smart Estimate
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-primary animate-pulse" />
              Generating Smart Estimate
            </CardTitle>
            <CardDescription>
              Our AI is analyzing your project details and creating a comprehensive estimate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-10 flex flex-col items-center justify-center">
              <div className="w-full max-w-md mb-8">
                <Progress value={progressValue} className="h-2" />
              </div>
              <div className="flex items-center mb-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-4" />
                <p className="text-lg">{processingStatus}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                This may take up to 30 seconds while we analyze thousands of similar projects to create 
                the most accurate estimate for your specific needs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && aiEstimate && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
                  AI-Generated Estimate
                </CardTitle>
                <CardDescription>
                  Review the AI-generated estimate details before saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...finalEstimateForm}>
                  <form onSubmit={finalEstimateForm.handleSubmit(onSubmitFinalForm)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={finalEstimateForm.control}
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
                        control={finalEstimateForm.control}
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

                    {finalEstimateForm.watch('isTemplate') && (
                      <FormField
                        control={finalEstimateForm.control}
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
                        onClick={() => setStep('input')}
                        disabled={createEstimateMutation.isPending}
                      >
                        Back to Edit
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createEstimateMutation.isPending}
                      >
                        {createEstimateMutation.isPending ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Estimate
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <div className="rounded-md border">
                    <ScrollArea className="max-h-[400px]">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="py-3 px-4 text-left font-medium">Item</th>
                            <th className="py-3 px-4 text-left font-medium">Description</th>
                            <th className="py-3 px-4 text-right font-medium">Unit Price</th>
                            <th className="py-3 px-4 text-right font-medium">Qty</th>
                            <th className="py-3 px-4 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiEstimate.lineItems.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.category}</div>
                              </td>
                              <td className="py-3 px-4 text-sm">{item.description}</td>
                              <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-3 px-4 text-right">{item.quantity}</td>
                              <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </div>

                  <h3 className="text-lg font-semibold">Project Timeframe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium mb-2">Design Phase</h4>
                        <p className="text-xl font-semibold">{aiEstimate.timeEstimate.designPhase}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium mb-2">Procurement Phase</h4>
                        <p className="text-xl font-semibold">{aiEstimate.timeEstimate.procurementPhase}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium mb-2">Implementation Phase</h4>
                        <p className="text-xl font-semibold">{aiEstimate.timeEstimate.implementationPhase}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    {aiEstimate.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Project cost allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-center mb-6">{formatCurrency(aiEstimate.totalEstimate)}</h3>
                    <p className="text-sm text-muted-foreground text-center mb-8">Total Project Cost</p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(aiEstimate.breakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="capitalize">{category}</div>
                        </div>
                        <div className="font-medium">{formatCurrency(amount)}</div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <div>Total</div>
                      <div>{formatCurrency(aiEstimate.totalEstimate)}</div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <h4 className="font-medium">Milestone Payments</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>Project Initiation (40%)</div>
                        <div>{formatCurrency(aiEstimate.totalEstimate * 0.4)}</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>Design Development (40%)</div>
                        <div>{formatCurrency(aiEstimate.totalEstimate * 0.4)}</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>Project Completion (20%)</div>
                        <div>{formatCurrency(aiEstimate.totalEstimate * 0.2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {step === 'saving' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Save className="h-5 w-5 mr-2 text-primary animate-pulse" />
              Saving Estimate
            </CardTitle>
            <CardDescription>
              Creating your AI-generated estimate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-10 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
              <p className="text-lg mb-2">Saving your estimate...</p>
              <p className="text-sm text-muted-foreground">This will only take a moment</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}