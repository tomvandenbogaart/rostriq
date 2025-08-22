import { ColorPalette, ContrastChecker } from "@/components/ui/color-palette"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, User, Settings, LogOut } from "lucide-react"

export default function ColorShowcasePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Enhanced Color Scheme & Contrast</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          This page showcases the improved contrast, colors, and visual hierarchy 
          implemented across all UI components for better accessibility and visual appeal.
        </p>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            The new color scheme provides better contrast ratios and more vibrant, 
            professional colors while maintaining accessibility standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPalette />
        </CardContent>
      </Card>

      {/* Contrast Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Contrast Examples</CardTitle>
          <CardDescription>
            Real-world examples of text on different background colors to demonstrate 
            the improved readability and contrast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContrastChecker />
        </CardContent>
      </Card>

      {/* Enhanced Components */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced UI Components</CardTitle>
          <CardDescription>
            All components now feature improved shadows, borders, focus states, 
            and better visual feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Form Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demo-input">Input Field</Label>
                <Input id="demo-input" placeholder="Type something here..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-textarea">Textarea</Label>
                <Textarea id="demo-textarea" placeholder="Multi-line text..." />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Switches</h3>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch id="switch-1" />
                <Label htmlFor="switch-1">Switch 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="switch-2" defaultChecked />
                <Label htmlFor="switch-2">Switch 2</Label>
              </div>
            </div>
          </div>

          {/* Avatars */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Avatars</h3>
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Dropdown Menu</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Open Menu
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Improvements</CardTitle>
          <CardDescription>
            Enhanced focus states, better contrast ratios, and improved visual 
            feedback for better user experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Focus States</h4>
              <p className="text-sm text-muted-foreground">
                All interactive elements now have clear, visible focus indicators 
                with proper contrast and offset.
              </p>
              <Button className="w-full">Try focusing this button</Button>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Enhanced Shadows</h4>
              <p className="text-sm text-muted-foreground">
                Improved shadow system provides better depth perception and 
                visual hierarchy.
              </p>
              <div className="p-4 bg-card rounded-lg shadow-lg border-2 border-border">
                Enhanced Card
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Information */}
      <Card>
        <CardHeader>
          <CardTitle>Theme System</CardTitle>
          <CardDescription>
            The new color scheme works seamlessly with both light and dark themes, 
            providing consistent contrast and visual appeal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Light Theme</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enhanced contrast with deep blues and warm grays</li>
                <li>• Vibrant accent colors for better visual hierarchy</li>
                <li>• Improved border and shadow system</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Dark Theme</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bright, accessible colors on dark backgrounds</li>
                <li>• Consistent contrast ratios maintained</li>
                <li>• Enhanced visual feedback and states</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
