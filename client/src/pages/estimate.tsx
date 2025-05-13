import { useParams, useLocation } from "wouter";
import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Send, Share2, Download, Copy } from "lucide-react";

const estimateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_id: z.number().optional(),
  lead_id: z.number(),
  scope: z.object({
    projectType: z.string(),
    roomCount: z.number(),
    sqft: z.number().min(1, "Square footage is required"),
    layoutType: z.string(),
    rooms: z.array(z.string()),
    furniture: z.enum(["basic", "mid", "premium"]),
    appliances: z.enum(["basic", "mid", "premium"]),
    lighting: z.enum(["basic", "mid", "premium"]),
    customMaterials: z.boolean(),
    additionalServices: z.array(z.string()),
    comments: z.string().optional(),
  }),
  milestone1Percentage: z.number().default(40),
  milestone2Percentage: z.number().default(40),
  milestone3Percentage: z.number().default(20),
  isTemplate: z.boolean().default(false),
  templateName: z.string().optional(),
});

type EstimateFormValues = z.infer<typeof estimateSchema>;

export default function EstimatePage() {
  const { leadId } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("scope");
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [calculatedFees, setCalculatedFees] = useState({
    subtotal: 0,
    gst: 0,
    total: 0,
    milestone1: 0,
    milestone2: 0,
    milestone3: 0
  });

  // Fetch lead details
  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ['/api/leads', Number(leadId)],
    queryFn: () => leadId ? apiRequest(`/api/leads/${leadId}`) : null,
    enabled: !!leadId,
  });

  // Fetch pricing configs
  const { data: pricingConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['/api/estimate-configs'],
    queryFn: () => apiRequest('/api/estimate-configs?configType=pricing'),
  });

  // Fetch room types
  const { data: roomTypes, isLoading: roomTypesLoading } = useQuery({
    queryKey: ['/api/estimate-configs'],
    queryFn: () => apiRequest('/api/estimate-configs?configType=roomType'),
  });

  // Fetch service types
  const { data: serviceTypes, isLoading: serviceTypesLoading } = useQuery({
    queryKey: ['/api/estimate-configs'],
    queryFn: () => apiRequest('/api/estimate-configs?configType=service'),
  });

  // Fetch existing estimates for this lead
  const { data: existingEstimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ['/api/estimates/lead', Number(leadId)],
    queryFn: () => leadId ? apiRequest(`/api/estimates/lead/${leadId}`) : null,
    enabled: !!leadId,
  });

  // Fetch estimate templates
  const { data: estimateTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/estimate-templates'],
    queryFn: () => apiRequest('/api/estimate-templates'),
  });

  // Get pricing config
  const getPricingConfig = (configName: string) => {
    if (!pricingConfigs || !Array.isArray(pricingConfigs)) return null;
    const config = pricingConfigs.find(t => t.name === configName);
    return config ? config.config : null;
  };

  // Setup form with default values
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: lead ? `Estimate for ${lead.name}` : "New Estimate",
      lead_id: leadId ? Number(leadId) : 0,
      client_id: lead?.client_id || undefined,
      scope: {
        projectType: "residential",
        roomCount: 1,
        sqft: 0,
        layoutType: "open",
        rooms: [],
        furniture: "mid",
        appliances: "mid",
        lighting: "mid",
        customMaterials: false,
        additionalServices: [],
        comments: "",
      },
      milestone1Percentage: 40,
      milestone2Percentage: 40,
      milestone3Percentage: 20,
      isTemplate: false,
      templateName: "",
    }
  });

  // Update form values when lead is loaded
  useEffect(() => {
    if (lead) {
      form.setValue("title", `Estimate for ${lead.name}`);
      form.setValue("lead_id", Number(leadId));
      if (lead.client_id) {
        form.setValue("client_id", lead.client_id);
      }
    }
  }, [lead, leadId, form]);

  // Calculate price based on form values
  const calculatePrice = () => {
    setCalculatingPrice(true);
    
    try {
      const formValues = form.getValues();
      const { scope } = formValues;
      
      // Get base rates from config
      const basePricing = getPricingConfig("baseRates");
      const furniturePricing = getPricingConfig("furniture");
      const appliancePricing = getPricingConfig("appliances");
      const lightingPricing = getPricingConfig("lighting");
      const roomRates = getPricingConfig("roomTypes");
      const serviceRates = getPricingConfig("additionalServices");
      
      if (!basePricing || !furniturePricing || !appliancePricing || 
          !lightingPricing || !roomRates || !serviceRates) {
        throw new Error("Missing pricing configuration");
      }
      
      // Base calculation
      let subtotal = basePricing.baseRate * scope.sqft;
      
      // Add per-room costs
      subtotal += scope.roomCount * basePricing.perRoomRate;
      
      // Add room type costs
      if (scope.rooms && scope.rooms.length > 0) {
        scope.rooms.forEach(room => {
          const roomConfig = roomRates[room];
          if (roomConfig) {
            subtotal += roomConfig.baseRate;
            if (scope.sqft > 0) {
              subtotal += roomConfig.perSqftRate * scope.sqft / scope.roomCount;
            }
          }
        });
      }
      
      // Add furniture costs
      subtotal += furniturePricing[scope.furniture].rate * scope.sqft;
      
      // Add appliance costs
      subtotal += appliancePricing[scope.appliances].rate * scope.sqft;
      
      // Add lighting costs
      subtotal += lightingPricing[scope.lighting].rate * scope.sqft;
      
      // Add custom materials fee
      if (scope.customMaterials && basePricing.customMaterialsFee) {
        subtotal += basePricing.customMaterialsFee;
      }
      
      // Add additional services
      if (scope.additionalServices && scope.additionalServices.length > 0) {
        scope.additionalServices.forEach(service => {
          const serviceConfig = serviceRates[service];
          if (serviceConfig) {
            subtotal += serviceConfig.baseRate;
            if (serviceConfig.hasSqftComponent && scope.sqft > 0) {
              subtotal += serviceConfig.perSqftRate * scope.sqft;
            }
          }
        });
      }
      
      // Calculate GST
      const gst = subtotal * (basePricing.gstRate || 0.05);
      const total = subtotal + gst;
      
      // Calculate milestone payments
      const milestone1 = (total * formValues.milestone1Percentage / 100);
      const milestone2 = (total * formValues.milestone2Percentage / 100);
      const milestone3 = (total * formValues.milestone3Percentage / 100);
      
      setCalculatedFees({
        subtotal,
        gst,
        total,
        milestone1,
        milestone2,
        milestone3
      });
      
      toast({
        title: "Estimate calculated",
        description: "Your estimate has been calculated.",
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      toast({
        title: "Error calculating price",
        description: "There was an error calculating the price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: number) => {
    const template = estimateTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    // Convert configJSON from DB to object
    const configData = template.configJSON || {};
    
    // Update form values with template data
    form.setValue("scope", {
      ...form.getValues().scope,
      ...configData.scope
    });
    
    // Keep lead_id and client_id from the current form
    form.setValue("milestone1Percentage", configData.milestone1Percentage || 40);
    form.setValue("milestone2Percentage", configData.milestone2Percentage || 40);
    form.setValue("milestone3Percentage", configData.milestone3Percentage || 20);
    
    toast({
      title: "Template applied",
      description: `Applied template: ${template.name}`,
    });
    
    // Calculate the price with the new values
    calculatePrice();
  };

  // Handle form submit
  const onSubmit = async (data: EstimateFormValues) => {
    try {
      // Calculate values
      calculatePrice();
      
      // Prepare the estimate data
      const estimateData = {
        title: data.title,
        lead_id: data.lead_id,
        client_id: data.client_id,
        status: "draft",
        subtotal: calculatedFees.subtotal,
        gst: calculatedFees.gst,
        total: calculatedFees.total,
        milestoneBreakdown: {
          milestone1: {
            percentage: data.milestone1Percentage,
            amount: calculatedFees.milestone1,
            name: "Project Initiation"
          },
          milestone2: {
            percentage: data.milestone2Percentage,
            amount: calculatedFees.milestone2,
            name: "Design Development"
          },
          milestone3: {
            percentage: data.milestone3Percentage,
            amount: calculatedFees.milestone3,
            name: "Project Completion"
          }
        },
        configJSON: {
          scope: data.scope,
          milestone1Percentage: data.milestone1Percentage,
          milestone2Percentage: data.milestone2Percentage,
          milestone3Percentage: data.milestone3Percentage
        },
        isTemplate: data.isTemplate
      };
      
      // If it's a template, use the template name
      if (data.isTemplate && data.templateName) {
        estimateData.title = data.templateName;
      }
      
      // Save the estimate
      const response = await apiRequest("/api/estimates", {
        method: "POST",
        body: JSON.stringify(estimateData),
      });
      
      toast({
        title: "Estimate created",
        description: "Your estimate has been saved successfully.",
      });
      
      // If it has a shareLink, set it
      if (response.sharedLink) {
        setShareLink(response.sharedLink);
      }
      
      // Navigate back to lead or estimates page
      if (!data.isTemplate) {
        navigate("/crm");
      }
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        title: "Error saving estimate",
        description: "There was an error saving your estimate. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle save as template
  const handleSaveAsTemplate = () => {
    form.setValue("isTemplate", true);
    const values = form.getValues();
    form.handleSubmit(onSubmit)();
  };

  // Generate PDF
  const generatePdf = async () => {
    try {
      const estimateId = form.getValues().id;
      if (!estimateId) {
        toast({
          title: "Save required",
          description: "Please save the estimate first to generate a PDF.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest(`/api/estimates/${estimateId}/pdf`, {
        method: "POST",
      });
      
      if (response.pdfURL) {
        window.open(response.pdfURL, "_blank");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error generating PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (!shareLink) {
      toast({
        title: "Save required",
        description: "Please save the estimate first to share it.",
        variant: "destructive",
      });
      return;
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `Check out this estimate: ${shareLink}`
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // Loading state
  if (leadLoading || configsLoading || roomTypesLoading || serviceTypesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading estimate form...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/crm")} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM
        </Button>
        <h1 className="text-2xl font-bold">Create Estimate</h1>
      </div>
      
      {lead && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>
              Creating an estimate for {lead.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{lead.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{lead.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{lead.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stage</p>
                <p>{lead.stage || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {existingEstimates && existingEstimates.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Existing Estimates</CardTitle>
            <CardDescription>
              This lead already has {existingEstimates.length} estimate(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingEstimates.map((estimate: any) => (
                <div key={estimate.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div>
                    <p className="font-medium">{estimate.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ${estimate.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/estimates/${estimate.id}`)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Details</CardTitle>
              <CardDescription>
                Create an estimate based on project requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimate Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {estimateTemplates && estimateTemplates.length > 0 && (
                  <div className="mt-4">
                    <FormLabel>Start from Template</FormLabel>
                    <Select onValueChange={(value) => handleSelectTemplate(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {estimateTemplates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scope">Project Scope</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scope">
              <Card>
                <CardHeader>
                  <CardTitle>Project Scope</CardTitle>
                  <CardDescription>
                    Define the scope of the project.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scope.projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scope.sqft"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scope.roomCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Rooms</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="scope.layoutType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layout Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open Floor Plan</SelectItem>
                            <SelectItem value="traditional">Traditional</SelectItem>
                            <SelectItem value="mixed">Mixed Layout</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scope.rooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Types</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {roomTypes && Array.isArray(roomTypes) && roomTypes.map((roomType: any) => (
                            <div className="flex items-center space-x-2" key={roomType.name}>
                              <Checkbox
                                checked={field.value?.includes(roomType.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, roomType.name]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter((value) => value !== roomType.name)
                                    );
                                  }
                                }}
                              />
                              <label className="text-sm">{roomType.name}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Material Quality</h3>
                    
                    <FormField
                      control={form.control}
                      name="scope.furniture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Furniture</FormLabel>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="basic" id="furniture-basic" />
                              <label htmlFor="furniture-basic">Basic</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="mid" id="furniture-mid" />
                              <label htmlFor="furniture-mid">Mid-Range</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="premium" id="furniture-premium" />
                              <label htmlFor="furniture-premium">Premium</label>
                            </div>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scope.appliances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appliances</FormLabel>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="basic" id="appliances-basic" />
                              <label htmlFor="appliances-basic">Basic</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="mid" id="appliances-mid" />
                              <label htmlFor="appliances-mid">Mid-Range</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="premium" id="appliances-premium" />
                              <label htmlFor="appliances-premium">Premium</label>
                            </div>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scope.lighting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lighting</FormLabel>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="basic" id="lighting-basic" />
                              <label htmlFor="lighting-basic">Basic</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="mid" id="lighting-mid" />
                              <label htmlFor="lighting-mid">Mid-Range</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="premium" id="lighting-premium" />
                              <label htmlFor="lighting-premium">Premium</label>
                            </div>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scope.customMaterials"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Custom Materials</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Custom material sourcing and specification
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="scope.additionalServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Services</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {serviceTypes && Array.isArray(serviceTypes) && serviceTypes.map((serviceType: any) => (
                            <div className="flex items-center space-x-2" key={serviceType.name}>
                              <Checkbox
                                checked={field.value?.includes(serviceType.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, serviceType.name]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter((value) => value !== serviceType.name)
                                    );
                                  }
                                }}
                              />
                              <label className="text-sm">{serviceType.name}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scope.comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Comments</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional details or specific requirements"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("pricing")}
                    type="button"
                  >
                    Next
                  </Button>
                  <Button 
                    type="button"
                    onClick={calculatePrice}
                    disabled={calculatingPrice}
                  >
                    {calculatingPrice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>Calculate Price</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                  <CardDescription>
                    View the calculated pricing for this estimate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium text-muted-foreground mb-2">Subtotal</h3>
                      <p className="text-2xl font-bold">
                        ${calculatedFees.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium text-muted-foreground mb-2">GST (5%)</h3>
                      <p className="text-2xl font-bold">
                        ${calculatedFees.gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-6 bg-muted/10">
                    <h3 className="font-medium text-xl mb-2">Total</h3>
                    <p className="text-3xl font-bold">
                      ${calculatedFees.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={calculatePrice}
                    variant="secondary"
                    className="w-full"
                    disabled={calculatingPrice}
                  >
                    {calculatingPrice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recalculating...
                      </>
                    ) : (
                      <>Recalculate Price</>
                    )}
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("scope")}
                    type="button"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab("milestones")}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="milestones">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Milestones</CardTitle>
                  <CardDescription>
                    Define how payments will be structured across project milestones.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="milestone1Percentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between mb-2">
                          <FormLabel>Milestone 1: Project Initiation</FormLabel>
                          <span className="text-sm">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Slider 
                            defaultValue={[field.value]} 
                            max={100} 
                            step={5}
                            onValueChange={(vals) => {
                              const total = vals[0] + form.getValues().milestone2Percentage + form.getValues().milestone3Percentage;
                              if (total <= 100) {
                                field.onChange(vals[0]);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <p className="text-sm text-muted-foreground">
                            ${calculatedFees.milestone1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="milestone2Percentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between mb-2">
                          <FormLabel>Milestone 2: Design Development</FormLabel>
                          <span className="text-sm">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Slider 
                            defaultValue={[field.value]} 
                            max={100} 
                            step={5}
                            onValueChange={(vals) => {
                              const total = form.getValues().milestone1Percentage + vals[0] + form.getValues().milestone3Percentage;
                              if (total <= 100) {
                                field.onChange(vals[0]);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <p className="text-sm text-muted-foreground">
                            ${calculatedFees.milestone2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="milestone3Percentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between mb-2">
                          <FormLabel>Milestone 3: Project Completion</FormLabel>
                          <span className="text-sm">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Slider 
                            defaultValue={[field.value]} 
                            max={100} 
                            step={5}
                            onValueChange={(vals) => {
                              const total = form.getValues().milestone1Percentage + form.getValues().milestone2Percentage + vals[0];
                              if (total <= 100) {
                                field.onChange(vals[0]);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <p className="text-sm text-muted-foreground">
                            ${calculatedFees.milestone3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <p className="font-medium">
                      Total percentage: {form.getValues().milestone1Percentage + form.getValues().milestone2Percentage + form.getValues().milestone3Percentage}%
                    </p>
                    {(form.getValues().milestone1Percentage + form.getValues().milestone2Percentage + form.getValues().milestone3Percentage !== 100) && (
                      <p className="text-sm text-red-500 mt-1">
                        Total percentage must equal 100%.
                      </p>
                    )}
                  </div>
                  
                  {form.formState.errors.isTemplate && (
                    <div className="p-4 border rounded-md bg-destructive/10">
                      <p className="text-sm text-destructive">
                        {form.formState.errors.isTemplate.message}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
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
                            <FormLabel>Save as template</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Make this estimate available as a template for future estimates
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("isTemplate") && (
                      <FormField
                        control={form.control}
                        name="templateName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Residential Kitchen Premium" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("pricing")}
                    type="button"
                  >
                    Back
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSaveAsTemplate}
                      disabled={savingTemplate}
                    >
                      {savingTemplate ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving template...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save as template
                        </>
                      )}
                    </Button>
                    <Button type="submit">
                      Save Estimate
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {shareLink && (
            <Card>
              <CardHeader>
                <CardTitle>Share Estimate</CardTitle>
                <CardDescription>
                  Your estimate is ready to share.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input value={shareLink} readOnly />
                  <Button size="icon" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast({
                      title: "Copied!",
                      description: "Link copied to clipboard",
                    });
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={generatePdf} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={shareViaWhatsApp} className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}