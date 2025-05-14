import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ProjectReport, ProjectLog } from '../shared/schema';
import type { IStorage } from './storage';
import { format, subDays } from 'date-fns';

interface GeneratePdfOptions {
  includePhotos?: boolean; 
  includeNotes?: boolean;
}

/**
 * Generates a PDF report for a project based on logs and project information
 * @param report The project report record
 * @param logs Associated project logs to include in the report
 * @param project Project details
 * @param options Options for PDF generation
 * @returns URL to the generated PDF
 */
export async function generateProjectReportPdf(
  report: ProjectReport,
  logs: ProjectLog[],
  project: any,
  storage: IStorage,
  options: GeneratePdfOptions = { includePhotos: true, includeNotes: true }
): Promise<string> {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set up the document title and metadata
  const title = `${project.name} - ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report`;
  
  doc.setProperties({
    title,
    subject: `Project report for ${project.name}`,
    author: 'DesignFlowStudio',
    keywords: 'interior design, project report',
    creator: 'DesignFlowStudio'
  });

  // Add the report header
  doc.setFontSize(20);
  doc.text(title, 14, 20);
  
  // Add report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'PP')}`, 14, 30);
  
  if (report.start_date && report.end_date) {
    doc.text(`Period: ${format(new Date(report.start_date), 'PP')} to ${format(new Date(report.end_date), 'PP')}`, 14, 35);
  }
  
  // Add project summary
  doc.setFontSize(12);
  doc.text('Project Summary', 14, 45);
  
  doc.setFontSize(10);
  const summaryData = [
    ['Project Name', project.name],
    ['Status', project.status || 'Not set'],
    ['Location', project.location || 'Not set'],
    ['Progress', `${project.progress || 0}%`],
    ['Description', project.description || 'No description available']
  ];
  
  (doc as any).autoTable({
    startY: 50,
    head: [['Attribute', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 230] }
  });
  
  // Add rooms summary if available
  if (project.rooms && Array.isArray(project.rooms) && project.rooms.length > 0) {
    doc.text('Rooms & Zones', 14, (doc as any).lastAutoTable.finalY + 10);
    
    const roomsData = project.rooms.map((room: any) => [
      room.name,
      room.type || 'Not set',
      `${room.progress || 0}%`,
      room.status || 'Not set'
    ]);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Name', 'Type', 'Progress', 'Status']],
      body: roomsData,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 230] }
    });
  }
  
  // Add log entries if available
  if (logs && logs.length > 0 && options.includeNotes) {
    doc.text('Progress Logs', 14, (doc as any).lastAutoTable.finalY + 10);
    
    // Group logs by date
    const groupedLogs: { [key: string]: ProjectLog[] } = {};
    
    logs.forEach(log => {
      const date = format(new Date(log.created_at!), 'PP');
      if (!groupedLogs[date]) {
        groupedLogs[date] = [];
      }
      groupedLogs[date].push(log);
    });
    
    // Format logs for the table
    const logsData: any[] = [];
    
    Object.keys(groupedLogs).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    }).forEach(date => {
      logsData.push([date, '', '', '']);
      
      groupedLogs[date].forEach(log => {
        const roomName = log.room_id 
          ? project.rooms.find((room: any) => room.id === log.room_id)?.name || log.room_id
          : 'General';
          
        logsData.push([
          format(new Date(log.created_at!), 'h:mm a'),
          roomName,
          log.log_type,
          log.text
        ]);
        
        if (log.photo_url && options.includePhotos) {
          // If there's a photo, we'd add it in a real implementation
          // This would require more complex handling with image insertion
          logsData.push(['', '', 'Photo', log.photo_caption || 'No caption']);
        }
      });
    });
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Time', 'Room', 'Type', 'Details']],
      body: logsData,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 230] }
    });
  }
  
  // Add a summary of tasks if available
  if (project.tasks && Array.isArray(project.tasks) && project.tasks.length > 0) {
    doc.text('Tasks Overview', 14, (doc as any).lastAutoTable.finalY + 10);
    
    // Calculate task statistics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((task: any) => task.status === 'completed').length;
    const inProgressTasks = project.tasks.filter((task: any) => task.status === 'in_progress').length;
    const notStartedTasks = project.tasks.filter((task: any) => task.status === 'not_started').length;
    const delayedTasks = project.tasks.filter((task: any) => task.status === 'delayed').length;
    
    const tasksData = [
      ['Total Tasks', totalTasks.toString()],
      ['Completed', completedTasks.toString()],
      ['In Progress', inProgressTasks.toString()],
      ['Not Started', notStartedTasks.toString()],
      ['Delayed', delayedTasks.toString()],
      ['Completion Rate', `${Math.round((completedTasks / totalTasks) * 100)}%`]
    ];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Metric', 'Value']],
      body: tasksData,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 230] }
    });
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated by DesignFlowStudio • Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // In a real implementation, we would save the PDF to a file or cloud storage
  // For now, we'll simulate this by returning a fake URL
  const fileName = `report-${report.id}-${Date.now()}.pdf`;
  const pdfUrl = `/reports/${fileName}`;

  // Update the report with the PDF URL
  await storage.updateProjectReport(report.id, {
    pdf_url: pdfUrl
  });
  
  // In a real-world implementation, we would save the PDF buffer to a file or cloud storage system
  // const pdfBuffer = doc.output('arraybuffer');
  // await someStorageSystem.save(fileName, pdfBuffer);
  
  return pdfUrl;
}

/**
 * Schedules automatic generation of weekly project reports
 * @param storage Storage instance for database operations
 */
export async function scheduleWeeklyReports(storage: IStorage): Promise<void> {
  try {
    console.log("Checking for projects that need weekly reports...");
    
    // Get all active projects
    const projects = await storage.getProjects();
    
    for (const project of projects) {
      // Skip projects that don't have report settings or don't have auto-generate enabled
      if (!project.reportSettings || 
          typeof project.reportSettings !== 'object' || 
          !(project.reportSettings as any).autoGenerate) {
        continue;
      }
      
      // Check if it's time to generate a new report (1 week since last report)
      const reportSettings = project.reportSettings as any;
      const lastReportDate = project.lastReportDate ? new Date(project.lastReportDate) : null;
      const currentDate = new Date();
      
      // If no previous report, or it's been more than a week since the last report
      if (!lastReportDate || 
          (currentDate.getTime() - lastReportDate.getTime() > 7 * 24 * 60 * 60 * 1000)) {
        console.log(`Generating weekly report for project ${project.id} - ${project.name}`);
        
        // Create a new report record
        const oneWeekAgo = subDays(currentDate, 7);
        
        const newReport = await storage.createProjectReport({
          project_id: project.id,
          report_type: "weekly",
          start_date: oneWeekAgo,
          end_date: currentDate,
          includes_photos: reportSettings.includePhotos ?? true,
          includes_notes: reportSettings.includeNotes ?? true
        });
        
        if (newReport) {
          // Get all logs for the period
          const logs = await storage.getProjectLogsByDateRange(
            project.id, 
            oneWeekAgo,
            currentDate
          );
          
          // Generate the PDF report
          const pdfUrl = await generateProjectReportPdf(
            newReport,
            logs,
            project,
            storage,
            {
              includePhotos: reportSettings.includePhotos ?? true,
              includeNotes: reportSettings.includeNotes ?? true
            }
          );
          
          // Update the project's last report date
          await storage.updateProject(project.id, {
            lastReportDate: currentDate
          });
          
          // Log activity
          await storage.createActivity({
            type: "report",
            description: "Weekly project report generated",
            project_id: project.id,
            metadata: {
              reportId: newReport.id,
              reportType: "weekly",
              pdfUrl
            }
          });
          
          console.log(`Successfully generated weekly report for project ${project.id}`);
        }
      }
    }
    
    console.log("Weekly report scheduling complete");
  } catch (error) {
    console.error("Error scheduling weekly reports:", error);
  }
}