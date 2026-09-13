import { useState } from "react";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function AdminDemoProperties() {
  const { properties, deleteProperty, openAddPropertyModal, openEditPropertyModal } = usePreLaunch();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = properties.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Pre-Launch Demo Properties ({filteredProperties.length})</CardTitle>
            <CardDescription>Manage the mock properties shown in the pre-launch landing page</CardDescription>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={openAddPropertyModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Demo Property
            </Button>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search demo properties..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProperties.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No demo properties found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Beds/Baths</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.location}</TableCell>
                  <TableCell>${p.price}</TableCell>
                  <TableCell>{p.beds} beds / {p.baths} baths</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditPropertyModal(p)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (window.confirm("Are you sure you want to delete this demo property?")) {
                        deleteProperty(p.id);
                      }
                    }} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
