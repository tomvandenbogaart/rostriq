'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import type { CompanyFunctionView, CreateCompanyFunction } from '@/types/database'

interface CompanyFunctionsManagerProps {
  companyId: string
  currentUserId: string
}

export function CompanyFunctionsManager({ companyId, currentUserId }: CompanyFunctionsManagerProps) {
  const [functions, setFunctions] = useState<CompanyFunctionView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newFunction, setNewFunction] = useState<CreateCompanyFunction>({
    company_id: companyId,
    name: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
    created_by: currentUserId,
  })

  useEffect(() => {
    loadFunctions()
  }, [companyId])

  const loadFunctions = async () => {
    try {
      setIsLoading(true)
      const data = await CompanyFunctionsService.getCompanyFunctions(companyId)
      setFunctions(data)
    } catch (error) {
      console.error('Error loading functions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFunction = async () => {
    if (!newFunction.name.trim()) return

    try {
      setIsCreating(true)
      await CompanyFunctionsService.createCompanyFunction(newFunction)
      setNewFunction({
        company_id: companyId,
        name: '',
        description: '',
        color: '#3b82f6',
        is_active: true,
        created_by: currentUserId,
      })
      await loadFunctions()
    } catch (error) {
      console.error('Error creating function:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteFunction = async (functionId: string) => {
    if (!confirm('Are you sure you want to delete this function? This will remove it from all employee assignments.')) {
      return
    }

    try {
      await CompanyFunctionsService.deleteCompanyFunction(functionId)
      await loadFunctions()
    } catch (error) {
      console.error('Error deleting function:', error)
    }
  }

  const handleUpdateFunction = async (functionId: string, updates: Partial<CompanyFunctionView>) => {
    try {
      await CompanyFunctionsService.updateCompanyFunction(functionId, updates)
      await loadFunctions()
    } catch (error) {
      console.error('Error updating function:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading functions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Function */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Function</CardTitle>
          <CardDescription>
            Add a new function or role that employees can be assigned to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="function-name">Function Name</Label>
              <Input
                id="function-name"
                placeholder="e.g., Dish Washing, Food Preparation"
                value={newFunction.name}
                onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="function-description">Description (Optional)</Label>
              <Input
                id="function-description"
                placeholder="Brief description of the function"
                value={newFunction.description}
                onChange={(e) => setNewFunction({ ...newFunction, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="function-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="function-color"
                  type="color"
                  value={newFunction.color}
                  onChange={(e) => setNewFunction({ ...newFunction, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newFunction.color}
                  onChange={(e) => setNewFunction({ ...newFunction, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreateFunction} 
            disabled={isCreating || !newFunction.name.trim()}
            className="w-full md:w-auto"
          >
            {isCreating ? 'Creating...' : 'Create Function'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Company Functions</CardTitle>
          <CardDescription>
            Manage existing functions and their assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {functions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No functions created yet. Create your first function above.
            </div>
          ) : (
            <div className="space-y-4">
              {functions.map((func) => (
                <FunctionCard
                  key={func.id}
                  func={func}
                  onDelete={handleDeleteFunction}
                  onUpdate={handleUpdateFunction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface FunctionCardProps {
  func: CompanyFunctionView
  onDelete: (functionId: string) => void
  onUpdate: (functionId: string, updates: Partial<CompanyFunctionView>) => void
}

function FunctionCard({ func, onDelete, onUpdate }: FunctionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: func.name,
    description: func.description || '',
    color: func.color,
  })

  const handleSave = () => {
    onUpdate(func.id, editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      name: func.name,
      description: func.description || '',
      color: func.color,
    })
    setIsEditing(false)
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: func.color }}
          />
          {isEditing ? (
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-48"
            />
          ) : (
            <h3 className="font-medium">{func.name}</h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete(func.id)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div>
            <Label className="text-sm">Description</Label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Description (optional)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Color</Label>
            <Input
              type="color"
              value={editData.color}
              onChange={(e) => setEditData({ ...editData, color: e.target.value })}
              className="w-16 h-10 p-1"
            />
            <Input
              value={editData.color}
              onChange={(e) => setEditData({ ...editData, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {func.description && (
            <p className="text-sm text-muted-foreground">{func.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{func.assigned_employees_count} employees assigned</span>
            <span>Created {new Date(func.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
