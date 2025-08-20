import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Settings, Database } from 'lucide-react';

const demoComponents = [
  {
    title: 'Monthly Schedule View',
    description: 'Interactive monthly calendar showing team working schedules',
    icon: Calendar,
    href: '/demo-functions/monthly-schedule',
    features: [
      'Monthly calendar navigation',
      'Employee schedule display',
      'Working hours calculation',
      'Team insights and statistics'
    ]
  },
  {
    title: 'Team Management',
    description: 'Complete team directory with role management and schedules',
    icon: Users,
    href: '/team',
    features: [
      'Team member management',
      'Role and function assignment',
      'Working schedule editor',
      'Monthly schedule view'
    ]
  },
  {
    title: 'Company Functions',
    description: 'Manage company roles and employee assignments',
    icon: Settings,
    href: '/company-settings',
    features: [
      'Function creation and management',
      'Employee assignment',
      'Color coding system',
      'Primary function designation'
    ]
  },
  {
    title: 'Database Testing',
    description: 'Test database connections and queries',
    icon: Database,
    href: '/test-db',
    features: [
      'Database connection test',
      'Query execution',
      'Schema validation',
      'Data integrity checks'
    ]
  }
];

export default function DemoFunctionsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Demo Functions</h1>
        <p className="text-muted-foreground">
          Explore the various features and components of the Rostriq application
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demoComponents.map((component) => {
          const Icon = component.icon;
          return (
            <Card key={component.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{component.title}</CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {component.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button asChild className="w-full">
                  <Link href={component.href}>
                    View Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-12 p-6 bg-muted/30 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About These Demos</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            These demo functions showcase the core features of the Rostriq application, 
            designed for restaurant and service industry team management.
          </p>
          <p>
            Each component demonstrates real-world functionality including team scheduling, 
            role management, and operational insights that help businesses optimize their workforce.
          </p>
          <p>
            Use these demos to understand how the application works and explore different 
            features before implementing them in your own workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
