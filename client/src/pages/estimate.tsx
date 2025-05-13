import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calculator, 
  Save, 
  Send, 
  Download, 
  ChevronLeft,
  Copy,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for our estimate form
interface EstimateFormData {
  title: string;
  leadId: number | null;
  clientId: number | null;
  squareFootage: number;
  layoutType: string;
  rooms: string[];
  finishLevel: string;
  additionalOptions: {
    includeFurniture: boolean;
    includeAppliances: boolean;
    includeFixtures: boolean;
    includeLighting: boolean;
  };
  notes: string;
}

interface PricingRule {
  id: number;
  name: string;
  description: string;
  configType: string;
  config: any;
  isActive: boolean;
}

interface CalculationResult {
  subtotal: number;
  gst: number;
  total: number;
  milestoneBreakdown: {
    name: string;
    percentage: number;
    amount: number;
  }[];
}

const DEFAULT_FORM_DATA: EstimateFormData = {
  title: 'New Estimate',
  leadId: null,
  clientId: null,
  squareFootage: 500,
  layoutType: 'open',
  rooms: [],
  finishLevel: 'standard',
  additionalOptions: {
    includeFurniture: false,
    includeAppliances: false,
    includeFixtures: true,
    includeLighting: true,
  },
  notes: '',
};

// Constants for pricing calculations
const GST_RATE = 0.05; // 5% GST
const MILESTONE_SPLITS = [
  { name: 'Initial Deposit', percentage: 0.4 }, // 40%
  { name: 'Mid-Project Payment', percentage: 0.4 }, // 40%
  { name: 'Final Payment', percentage: 0.2 }, // 20%
];

const EstimatePage: React.FC = () => {
  const { leadId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EstimateFormData>({
    ...DEFAULT_FORM_DATA,
    leadId: leadId ? parseInt(leadId) : null,
  });
  
  const [calculationResult, setCalculationResult] = useState<CalculationResult>({
    subtotal: 0,
    gst: 0,
    total: 0,
    milestoneBreakdown: []
  });
  
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTemplate, setIsTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  
  // Fetch pricing configuration from the API
  const { data: pricingRules, isLoading: isLoadingPricingRules } = useQuery({
    queryKey: ['/api/estimate-configs'],
    queryFn: async () => {
      return await apiRequest<PricingRule[]>({ url: '/api/estimate-configs' });
    }
  });
  
  // Fetch lead data if leadId is provided
  const { data: leadData, isLoading: isLoadingLead } = useQuery({
    queryKey: ['/api/leads', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      return await apiRequest({ url: `/api/leads/${leadId}` });
    },
    enabled: !!leadId
  });
  
  // Fetch estimate templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/estimates/templates'],
    queryFn: async () => {
      return await apiRequest({ url: '/api/estimates/templates' });
    }
  });

  // Use a mutation to save the estimate
  const createEstimateMutation = useMutation({
    mutationFn: async (newEstimate: any) => {
      return await apiRequest({
        url: '/api/estimates',
        method: 'POST',
        data: newEstimate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      toast({
        title: "Estimate Saved",
        description: "Your estimate has been saved successfully",
      });
      
      // Redirect to leads page after successful save
      setTimeout(() => {
        setLocation('/leads');
      }, 1500);
    },
    onError: (error) => {
      console.error('Error saving estimate:', error);
      toast({
        title: "Error Saving",
        description: "There was an error saving your estimate. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Effect to set the title if we have lead data
  useEffect(() => {
    if (leadData) {
      setFormData(prev => ({
        ...prev,
        title: `Estimate for ${leadData.name}`,
        clientId: leadData.client_id || null
      }));
    }
  }, [leadData]);
  
  // Calculate pricing based on form inputs
  const calculatePricing = () => {
    if (!pricingRules || pricingRules.length === 0) {
      toast({
        title: "Missing Pricing Data",
        description: "No pricing rules found. Please set up pricing configurations first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      // Basic calculations - in a real app, this would use the pricing rules from the database
      // For now, we'll use some fixed rates for demonstration
      const basePricePerSqft = 100; // $100 per sqft base price
      
      // Adjust for layout type
      let layoutMultiplier = 1.0;
      switch (formData.layoutType) {
        case 'open':
          layoutMultiplier = 1.0;
          break;
        case 'semi-open':
          layoutMultiplier = 1.1;
          break;
        case 'traditional':
          layoutMultiplier = 1.2;
          break;
        case 'custom':
          layoutMultiplier = 1.3;
          break;
      }
      
      // Adjust for finish level
      let finishMultiplier = 1.0;
      switch (formData.finishLevel) {
        case 'basic':
          finishMultiplier = 0.8;
          break;
        case 'standard':
          finishMultiplier = 1.0;
          break;
        case 'premium':
          finishMultiplier = 1.3;
          break;
        case 'luxury':
          finishMultiplier = 1.6;
          break;
      }
      
      // Calculate room costs
      const roomAdditional = formData.rooms.length * 500; // $500 per room selected
      
      // Calculate additional options
      let optionsTotal = 0;
      if (formData.additionalOptions.includeFurniture) optionsTotal += formData.squareFootage * 20;
      if (formData.additionalOptions.includeAppliances) optionsTotal += 3500;
      if (formData.additionalOptions.includeFixtures) optionsTotal += 1500;
      if (formData.additionalOptions.includeLighting) optionsTotal += 1200;
      
      // Calculate subtotal
      const subtotal = Math.round(
        (formData.squareFootage * basePricePerSqft * layoutMultiplier * finishMultiplier) + 
        roomAdditional + 
        optionsTotal
      );
      
      // Calculate GST
      const gst = Math.round(subtotal * GST_RATE);
      
      // Calculate total
      const total = subtotal + gst;
      
      // Calculate milestone breakdown
      const milestoneBreakdown = MILESTONE_SPLITS.map(milestone => ({
        name: milestone.name,
        percentage: milestone.percentage,
        amount: Math.round(total * milestone.percentage)
      }));
      
      // Set calculation result
      setCalculationResult({
        subtotal,
        gst,
        total,
        milestoneBreakdown
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
      toast({
        title: "Calculation Error",
        description: "There was an error calculating the price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Handle saving the estimate
  const handleSaveEstimate = async () => {
    if (!user) {
      toast({
        title: "Authorization Error",
        description: "You must be logged in to save estimates",
        variant: "destructive",
      });
      return;
    }
    
    if (calculationResult.total === 0) {
      toast({
        title: "Calculation Required",
        description: "Please calculate the estimate before saving",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const estimateData = {
        title: formData.title,
        lead_id: formData.leadId,
        client_id: formData.clientId,
        subtotal: calculationResult.subtotal,
        gst: calculationResult.gst,
        total: calculationResult.total,
        status: 'draft',
        isTemplate: isTemplate,
        templateName: isTemplate ? templateName : null,
        milestoneBreakdown: calculationResult.milestoneBreakdown,
        configJSON: {
          formData,
          calculationResult
        }
      };
      
      await createEstimateMutation.mutateAsync(estimateData);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle loading an estimate template
  const handleLoadTemplate = (templateId: string) => {
    if (!templates) return;
    
    const template = templates.find(t => t.id.toString() === templateId);
    if (!template || !template.configJSON || !template.configJSON.formData) {
      toast({
        title: "Template Error",
        description: "Could not load the selected template",
        variant: "destructive",
      });
      return;
    }
    
    // Keep the current leadId and clientId
    const currentLeadId = formData.leadId;
    const currentClientId = formData.clientId;
    const currentTitle = formData.title;
    
    // Load template data
    setFormData({
      ...template.configJSON.formData,
      leadId: currentLeadId,
      clientId: currentClientId,
      title: currentTitle
    });
    
    // Recalculate with the new template data
    calculatePricing();
    
    toast({
      title: "Template Loaded",
      description: `Template "${template.templateName}" has been loaded`,
    });
  };
  
  const handleGoBack = () => {
    setLocation('/leads');
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Leads
          </Button>
          <div className="ml-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-medium focus:outline-none border-0 focus:border-b focus:border-gray-300 px-1"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={isCalculating} onClick={calculatePricing}>
            <Calculator className="h-4 w-4 mr-1" />
            Calculate
          </Button>
          <Button variant="outline" size="sm" disabled={calculationResult.total === 0 || isSaving}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" disabled={calculationResult.total === 0 || isSaving}>
            <Send className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSaveEstimate} 
            disabled={calculationResult.total === 0 || isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Form inputs */}
        <div className="w-1/3 overflow-auto p-4 bg-white border-r">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="rooms" className="flex-1">Rooms</TabsTrigger>
              <TabsTrigger value="options" className="flex-1">Options</TabsTrigger>
              <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <div className="flex items-center space-x-2">
                  <Slider 
                    id="squareFootage"
                    defaultValue={[500]}
                    min={100}
                    max={5000}
                    step={50}
                    value={[formData.squareFootage]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, squareFootage: value[0] }))}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    value={formData.squareFootage} 
                    onChange={(e) => setFormData(prev => ({ ...prev, squareFootage: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                    min={100}
                    max={5000}
                  />
                </div>
                <span className="text-xs text-gray-500">sq ft</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="layoutType">Layout Type</Label>
                <Select 
                  value={formData.layoutType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, layoutType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a layout type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open Concept</SelectItem>
                    <SelectItem value="semi-open">Semi-Open</SelectItem>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="finishLevel">Finish Level</Label>
                <RadioGroup 
                  value={formData.finishLevel} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, finishLevel: value }))}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="basic" id="finish-basic" />
                    <Label htmlFor="finish-basic" className="cursor-pointer">Basic</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="standard" id="finish-standard" />
                    <Label htmlFor="finish-standard" className="cursor-pointer">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="premium" id="finish-premium" />
                    <Label htmlFor="finish-premium" className="cursor-pointer">Premium</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="luxury" id="finish-luxury" />
                    <Label htmlFor="finish-luxury" className="cursor-pointer">Luxury</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="rooms" className="pt-4">
              <div className="space-y-2">
                <Label>Select Rooms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Living Room', 'Dining Room', 'Kitchen', 'Master Bedroom', 
                    'Bedroom', 'Bathroom', 'Home Office', 'Entrance/Foyer',
                    'Laundry Room', 'Basement', 'Attic', 'Outdoor Space'
                  ].map((room) => (
                    <div key={room} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`room-${room.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={formData.rooms.includes(room)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ ...prev, rooms: [...prev.rooms, room] }));
                          } else {
                            setFormData(prev => ({ ...prev, rooms: prev.rooms.filter(r => r !== room) }));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`room-${room.toLowerCase().replace(/\s+/g, '-')}`}
                        className="cursor-pointer"
                      >
                        {room}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="options" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Additional Options</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="option-furniture" className="cursor-pointer">Include Furniture</Label>
                    <Switch 
                      id="option-furniture"
                      checked={formData.additionalOptions.includeFurniture}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev, 
                          additionalOptions: {
                            ...prev.additionalOptions,
                            includeFurniture: checked
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="option-appliances" className="cursor-pointer">Include Appliances</Label>
                    <Switch 
                      id="option-appliances"
                      checked={formData.additionalOptions.includeAppliances}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev, 
                          additionalOptions: {
                            ...prev.additionalOptions,
                            includeAppliances: checked
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="option-fixtures" className="cursor-pointer">Include Fixtures</Label>
                    <Switch 
                      id="option-fixtures"
                      checked={formData.additionalOptions.includeFixtures}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev, 
                          additionalOptions: {
                            ...prev.additionalOptions,
                            includeFixtures: checked
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="option-lighting" className="cursor-pointer">Include Lighting</Label>
                    <Switch 
                      id="option-lighting"
                      checked={formData.additionalOptions.includeLighting}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev, 
                          additionalOptions: {
                            ...prev.additionalOptions,
                            includeLighting: checked
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter any special requirements or notes..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="pt-4 space-y-4">
              {isLoadingTemplates ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                </div>
              ) : templates && templates.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Load From Template</Label>
                    <Select onValueChange={handleLoadTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.templateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                </>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  No templates available
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="save-template"
                    checked={isTemplate}
                    onCheckedChange={(checked) => {
                      setIsTemplate(checked === true);
                    }}
                  />
                  <Label htmlFor="save-template" className="cursor-pointer">Save as Template</Label>
                </div>
                
                {isTemplate && (
                  <Input 
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side - Estimate Summary */}
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Summary</CardTitle>
              <CardDescription>
                {leadData ? (
                  <>Client: {leadData.name}</>
                ) : (
                  <>New Estimate</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Square Footage</p>
                    <p className="text-lg font-semibold">{formData.squareFootage} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Layout Type</p>
                    <p className="text-lg font-semibold capitalize">
                      {formData.layoutType.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Finish Level</p>
                    <p className="text-lg font-semibold capitalize">{formData.finishLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rooms</p>
                    <p className="text-lg font-semibold">{formData.rooms.length} selected</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-medium">${calculationResult.subtotal.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600">GST (5%)</p>
                    <p className="font-medium">${calculationResult.gst.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <p>Total</p>
                    <p>${calculationResult.total.toLocaleString()}</p>
                  </div>
                </div>
                
                {calculationResult.total > 0 && (
                  <>
                    <Separator />
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">Payment Schedule</h3>
                      
                      {calculationResult.milestoneBreakdown.map((milestone, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <p>{milestone.name} ({(milestone.percentage * 100)}%)</p>
                            <p className="font-medium">${milestone.amount.toLocaleString()}</p>
                          </div>
                          <Progress value={milestone.percentage * 100} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="w-full" onClick={calculatePricing} disabled={isCalculating}>
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Recalculate'}
              </Button>
              <Button className="w-full ml-2" onClick={handleSaveEstimate} disabled={calculationResult.total === 0 || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Estimate'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EstimatePage;