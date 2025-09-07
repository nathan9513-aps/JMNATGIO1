import MappingTable from "@/components/projects/mapping-table";

export default function Projects() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Project Mapping</h2>
      <p className="text-muted-foreground">
        Manage the mapping between FileMaker clients and Jira projects to streamline time tracking.
      </p>
      <MappingTable />
    </div>
  );
}
