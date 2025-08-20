'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import type { CompanyFunctionView, EmployeeFunctionView, CreateCompanyFunctionAssignment } from '@/types/database'

interface EmployeeFunctionAssignerProps {
  companyId: string
  currentUserId: string
}

export function EmployeeFunctionAssigner({ companyId, currentUserId }: EmployeeFunctionAssignerProps) {
  const [functions, setFunctions] = useState<CompanyFunctionView[]>([])
  const [employees, setEmployees] = useState<EmployeeFunctionView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [functionsData, employeesData] = await Promise.all([
        CompanyFunctionsService.getCompanyFunctions(companyId),
        CompanyFunctionsService.getAllEmployeesWithFunctions(companyId),
      ])
      setFunctions(functionsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignFunction = async (userId: string, functionId: string) => {
    try {
      setIsAssigning(true)
      const assignmentData: CreateCompanyFunctionAssignment = {
        company_id: companyId,
        user_id: userId,
        function_id: functionId,
        is_primary: false,
        assigned_by: currentUserId,
        is_active: true,
      }
      await CompanyFunctionsService.assignFunctionToEmployee(assignmentData)
      await loadData()
    } catch (error) {
      console.error('Error assigning function:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveFunction = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this function assignment?')) {
      return
    }

    try {
      await CompanyFunctionsService.removeFunctionFromEmployee(assignmentId)
      await loadData()
    } catch (error) {
      console.error('Error removing function assignment:', error)
    }
  }

  const handleSetPrimaryFunction = async (userId: string, functionId: string) => {
    try {
      await CompanyFunctionsService.setPrimaryFunction(userId, companyId, functionId)
      await loadData()
    } catch (error) {
      console.error('Error setting primary function:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading employees and functions...</div>
      </div>
    )
  }

  // Group employees by their functions for easier display
  const employeesByFunction = employees.reduce((acc, employee) => {
    if (!acc[employee.function_name]) {
      acc[employee.function_name] = []
    }
    acc[employee.function_name].push(employee)
    return acc
  }, {} as Record<string, EmployeeFunctionView[]>)

  // Get employees without any functions
  const employeesWithoutFunctions = employees.filter(emp => 
    !Object.values(employeesByFunction).flat().some(e => e.user_id === emp.user_id)
  )

  return (
    <div className="space-y-6">
      {/* Function Assignment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Function Assignments</CardTitle>
          <CardDescription>
            Manage which employees are assigned to which functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {functions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No functions created yet. Create functions first to assign employees.
            </div>
          ) : (
            <div className="space-y-6">
              {functions.map((func) => (
                <div key={func.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: func.color }}
                    />
                    <h3 className="font-medium">{func.name}</h3>
                    <Badge variant="secondary">
                      {employeesByFunction[func.name]?.length || 0} employees
                    </Badge>
                  </div>
                  
                  {func.description && (
                    <p className="text-sm text-muted-foreground mb-3">{func.description}</p>
                  )}

                  <div className="space-y-2">
                    {employeesByFunction[func.name]?.map((employee) => (
                      <EmployeeFunctionRow
                        key={employee.id}
                        employee={employee}
                        onRemove={() => handleRemoveFunction(employee.id)}
                        onSetPrimary={() => handleSetPrimaryFunction(employee.user_id, employee.function_id)}
                      />
                    )) || (
                      <div className="text-sm text-muted-foreground py-2">
                        No employees assigned to this function
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Function Assignment</CardTitle>
          <CardDescription>
            Assign functions to employees who don&apos;t have any yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeesWithoutFunctions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              All employees have functions assigned
            </div>
          ) : (
            <div className="space-y-3">
              {employeesWithoutFunctions.map((employee) => (
                <div key={employee.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {employee.avatar_url ? (
                        <img 
                          src={employee.avatar_url} 
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{employee.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignFunction(employee.user_id, e.target.value)
                        }
                      }}
                      disabled={isAssigning}
                    >
                      <option value="">Select function...</option>
                      {functions.map((func) => (
                        <option key={func.id} value={func.id}>
                          {func.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface EmployeeFunctionRowProps {
  employee: EmployeeFunctionView
  onRemove: () => void
  onSetPrimary: () => void
}

function EmployeeFunctionRow({ employee, onRemove, onSetPrimary }: EmployeeFunctionRowProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          {employee.avatar_url ? (
            <img 
              src={employee.avatar_url} 
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <span className="text-xs font-medium">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </span>
          )}
        </div>
        <div>
          <div className="text-sm font-medium">
            {employee.first_name} {employee.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{employee.email}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {employee.is_primary && (
          <Badge variant="default" className="text-xs">Primary</Badge>
        )}
        {!employee.is_primary && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSetPrimary}
            className="text-xs h-6 px-2"
          >
            Set Primary
          </Button>
        )}
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={onRemove}
          className="text-xs h-6 px-2"
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
