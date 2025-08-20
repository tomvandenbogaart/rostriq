# Company Functions System

This system allows company owners to create and manage custom functions (roles) that employees can be assigned to, such as "Dish Washing", "Food Preparation", "Cleaning", etc.

## Features

### 1. Company Functions Management
- **Create Functions**: Company owners can create custom functions with names, descriptions, and colors
- **Edit Functions**: Modify function details including name, description, and color
- **Delete Functions**: Soft delete functions (sets `is_active` to false)
- **Visual Management**: Color-coded functions for better organization

### 2. Employee Function Assignment
- **Assign Functions**: Assign employees to multiple functions
- **Primary Functions**: Set a primary function for each employee
- **Quick Assignment**: Easy assignment interface for employees without functions
- **Remove Assignments**: Remove function assignments from employees

### 3. Roster Integration
- **Dynamic Display**: Roster automatically shows real functions and employee assignments
- **Color Coding**: Functions are displayed with their assigned colors
- **Employee Scheduling**: Generate sample shifts based on actual function assignments

## Database Schema

### Tables

#### `company_functions`
- `id`: Unique identifier
- `company_id`: Reference to company
- `name`: Function name (e.g., "Dish Washing")
- `description`: Optional description
- `color`: Hex color for UI display
- `is_active`: Whether the function is active
- `created_by`: User who created the function
- `created_at`, `updated_at`: Timestamps

#### `company_function_assignments`
- `id`: Unique identifier
- `company_id`: Reference to company
- `user_id`: Reference to employee
- `function_id`: Reference to function
- `is_primary`: Whether this is the employee's primary function
- `assigned_by`: User who made the assignment
- `assigned_at`: When the assignment was made
- `is_active`: Whether the assignment is active

### Views

#### `company_functions_view`
- Combines function data with company info and employee count
- Shows how many employees are assigned to each function

#### `employee_functions_view`
- Shows all employee-function assignments with employee and function details
- Useful for roster generation and management

## Usage

### For Company Owners

1. **Create and Manage Functions**
   - Go to **Company Settings** → **Company Functions**
   - You must have 'owner' role to access
   - Create functions with names, descriptions, and colors
   - Edit and delete existing functions
   - View employee counts for each function

2. **Assign Functions to Employees**
   - Go to **Team Management** → **Function Assignments**
   - Assign functions to employees using the dropdown
   - Set primary functions for employees
   - Remove function assignments as needed

### For Employees

1. **View Your Functions**
   - Functions are displayed in the roster
   - Primary function is clearly marked
   - All assigned functions are visible

2. **Roster Display**
   - Functions are color-coded for easy identification
   - Employee names and schedules are shown by function
   - Real-time updates based on assignments

## API Endpoints

The system uses the `CompanyFunctionsService` class which provides:

- `getCompanyFunctions(companyId)`: Get all functions for a company
- `createCompanyFunction(functionData)`: Create a new function
- `updateCompanyFunction(functionId, updates)`: Update function details
- `deleteCompanyFunction(functionId)`: Soft delete a function
- `assignFunctionToEmployee(assignmentData)`: Assign function to employee
- `removeFunctionFromEmployee(assignmentId)`: Remove function assignment
- `setPrimaryFunction(userId, companyId, functionId)`: Set primary function
- `getAllEmployeesWithFunctions(companyId)`: Get all employees and their functions

## Security

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Role-based Access**: Only company owners and admins can manage functions
- **Company Isolation**: Users can only access functions for their company
- **Audit Trail**: All changes are tracked with timestamps and user references

## Usage

The company functions system is split between two pages for better organization:

**Company Settings** - Company owners can:
1. **Create Functions**: Add custom functions with names, descriptions, and colors
2. **Manage Functions**: Edit, delete, and organize company functions

**Team Management** - Company owners can:
3. **Assign Employees**: Assign functions to employees and set primary roles
4. **View Roster**: See functions in action on the dashboard roster

## Migration

The system requires database migration `20241201000008_create_company_functions.sql` which:

- Creates the necessary tables
- Sets up RLS policies
- Creates helpful views
- Establishes proper relationships

Run `npx supabase db reset` to apply all migrations including this one.

## Future Enhancements

- **Function Templates**: Pre-built function templates for common industries
- **Function Categories**: Group functions by department or type
- **Skill Requirements**: Add skill requirements to functions
- **Training Tracking**: Track employee training for specific functions
- **Performance Metrics**: Measure employee performance by function
- **Function Rotation**: Automate function rotation schedules

## Support

For questions or issues with the company functions system, refer to the codebase or contact the development team.
