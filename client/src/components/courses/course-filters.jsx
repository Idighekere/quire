
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { departments, levels, semesters } from "@/constants"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"



export default function CourseFilters({ filters, onFilterChange }) {
  return (
    <div className="space-y-6">

      <Accordion type='single' collapsible className='w-full'>

        {
  /* ANCHOR Department Filter */
}

  <AccordionItem value='departments'>
    <AccordionTrigger><h3 className="font-medium">Department</h3></AccordionTrigger>
    <AccordionContent>
     <RadioGroup
          value={filters.department}
          onValueChange={(value) => onFilterChange("department", value)}
          className="space-y-1.5"

        >
          {departments.map((department) => (
            <div key={department.id} className="flex items-center space-x-2">
              <RadioGroupItem value={department.slug} id={`department-${department.id}`} />
              <Label htmlFor={`department-${department.id}`} className="cursor-pointer">
                {department.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
    </AccordionContent>
  </AccordionItem>

      {/* ANCHOR Level Filter */}

  <AccordionItem value='level'>
    <AccordionTrigger><h3 className='font-medium'>Level</h3>
</AccordionTrigger>
    <AccordionContent>
    <RadioGroup
  value={filters.level}
  onValueChange={value => onFilterChange('level', value)}
  className='space-y-1.5'
>
  {levels.map(level => (
    <div key={level} className='flex items-center space-x-2'>
      <RadioGroupItem value={String(level)} id={`level-${level}`} defaultValue={level} />
      <Label htmlFor={`level-${level}`} className='cursor-pointer'>
        {level} Level
      </Label>
    </div>
  ))}
</RadioGroup>

    </AccordionContent>
  </AccordionItem>

      {/* ANCHOR -Semester Filter */}

  <AccordionItem value='semester'>
    <AccordionTrigger><h3 className='font-medium'>Semester</h3>
</AccordionTrigger>
    <AccordionContent>
  <RadioGroup
  value={filters.semester}
  onValueChange={value => onFilterChange('semester', value)}
  className='space-y-1.5'
>
  {semesters.map(semester => (
    <div key={semester.id} className='flex items-center space-x-2'>
      <RadioGroupItem
        value={semester.id}
        id={`semester-${semester.id}`}
      />
      <Label htmlFor={`semester-${semester.id}`} className='cursor-pointer'>
        {semester.name}
      </Label>
    </div>
  ))}
</RadioGroup>

    </AccordionContent>
  </AccordionItem>
</Accordion>

    </div>
  )
}
