import React, { useState, useEffect, useRef } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser } from '@clerk/nextjs'
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"

import { SOP, FormData, ViewMode, User } from "./types"
import { fetchSOPs, fetchUsers, createSOP, updateSOP, deleteSOP } from "./api"
import { getUniqueValues, filterSops, sortSops, handleStepImageUpload } from "./utils"
import { GridView, ListView, CompactView, TableView, CategoriesView } from "./views"
import { EmptyState } from "./empty-state"
import { SopCreateDialog, SopEditDialog, SopDeleteDialog } from "./dialogs"

export function SOPManager() {
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  // State
  const [sops, setSops] = useState<SOP[]>([]);
  const [filteredSops, setFilteredSops] = useState<SOP[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAuthor, setFilterAuthor] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOP | null>(null);
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch current user data
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCurrentUser(data);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      });
  }, []);

  // Check if user can perform CRUD operations
  const canCreateSop = currentUser?.role === 'ADMIN';
  const canEditSop = currentUser?.role === 'ADMIN';
  const canDeleteSop = currentUser?.role === 'ADMIN';

  // Fetch data
  useEffect(() => {
    fetchSOPs()
      .then(data => {
        setSops(data);
        setFilteredSops(data);
      })
      .catch(error => {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      });
  }, [toast]);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(error => {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      });
  }, [toast]);

  // Filter and sort SOPs
  useEffect(() => {
    const filtered = filterSops(sops, searchTerm, filterCategory, filterPriority, filterAuthor);
    const sorted = sortSops(filtered, sortBy);
    setFilteredSops(sorted);
  }, [sops, searchTerm, filterCategory, filterPriority, filterAuthor, sortBy]);

  // Event handlers
  const handleCreateSOP = async (newSOP: Omit<SOP, 'id' | 'createdAt' | 'updatedAt' | 'editedAt'>, accessGroupIds?: string[]) => {
    try {
      const sop = await createSOP(newSOP, accessGroupIds);
      setSops(prev => [sop, ...prev]);
      setIsCreateDialogOpen(false);
      
      toast({
        title: "SOP créé",
        description: "La procédure a été créée avec succès",
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSOP = async (id: string, updatedSOP: Partial<SOP>) => {
    try {
      const sop = await updateSOP(id, updatedSOP);
      setSops(prev => prev.map(s => s.id === id ? sop : s));
      setIsEditDialogOpen(false);
      setEditingSop(null);
      
      toast({
        title: "SOP modifié",
        description: "La procédure a été modifiée avec succès",
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSOP = async (sopId: string) => {
    try {
      await deleteSOP(sopId);
      setSops(prev => prev.filter(s => s.id !== sopId));
      setIsDeleteDialogOpen(false);
      setSopToDelete(null);
      setSelectedSop(null);
      
      toast({
        title: "SOP supprimé",
        description: "La procédure a été supprimée avec succès",
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditSOP = (sop: SOP) => {
    setEditingSop(sop);
    setIsEditDialogOpen(true);
  };

  const handleViewModeChange = (value: string) => {
    setViewMode(value as ViewMode);
    if (value === "categories") {
      setSelectedCategory(null);
      setSelectedSop(null);
    } else {
      setSelectedCategory(null);
      setSelectedSop(null);
    }
  };

  // Conditional rendering
  if (!isLoaded) return <div>Chargement...</div>;
  if (!isSignedIn) return <div className="flex justify-center items-center h-[60vh]">Veuillez vous connecter pour accéder à l'application.</div>;

  // Extract unique values for filters
  const uniqueCategories = getUniqueValues(sops, "category");
  const uniqueAuthors = getUniqueValues(sops, "author");
  
  // Render component
  return (
    <div className="p-6 bg-background min-h-screen">


      {/* Actions and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex gap-2">
          {canCreateSop && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="font-meutas font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Nouvelle procédure
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-meutas font-normal"
          />
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[180px] font-meutas font-normal">
              <SelectValue placeholder="Vue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid" className="font-meutas">Grille</SelectItem>
              <SelectItem value="list" className="font-meutas">Liste</SelectItem>
              <SelectItem value="compact" className="font-meutas">Compact</SelectItem>
              <SelectItem value="table" className="font-meutas">Tableau</SelectItem>
              <SelectItem value="categories" className="font-meutas">Catégories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] font-meutas font-normal">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-meutas">Toutes les catégories</SelectItem>
              {getUniqueValues(sops, 'category').map((category) => (
                <SelectItem key={category} value={category} className="font-meutas">{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px] font-meutas font-normal">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-meutas">Toutes les priorités</SelectItem>
              <SelectItem value="high" className="font-meutas">Haute</SelectItem>
              <SelectItem value="medium" className="font-meutas">Moyenne</SelectItem>
              <SelectItem value="low" className="font-meutas">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {filteredSops.length === 0 ? (
          <EmptyState hasSops={sops.length > 0} />
        ) : viewMode === "grid" ? (
          <GridView
            sops={filteredSops}
            onSelect={(sop) => setSelectedSop(sop)}
            onEdit={canEditSop ? handleEditSOP : undefined}
            onDelete={canDeleteSop ? (sop) => {
              setSopToDelete(sop);
              setIsDeleteDialogOpen(true);
            } : undefined}
          />
        ) : viewMode === "list" ? (
          <ListView
            sops={filteredSops}
            onViewDetails={(sop) => setSelectedSop(sop)}
            onEdit={canEditSop ? handleEditSOP : undefined}
          />
        ) : viewMode === "compact" ? (
          <CompactView
            sops={filteredSops}
            onViewDetails={(sop) => setSelectedSop(sop)}
            onEdit={canEditSop ? handleEditSOP : undefined}
          />
        ) : viewMode === "table" ? (
          <TableView
            sops={filteredSops}
            onViewDetails={(sop) => setSelectedSop(sop)}
            onEdit={canEditSop ? handleEditSOP : undefined}
          />
        ) : (
          <CategoriesView
            sops={filteredSops}
            selectedCategory={selectedCategory}
            selectedSop={selectedSop}
            onSelectCategory={setSelectedCategory}
            onSelectSop={setSelectedSop}
            onEdit={canEditSop ? handleEditSOP : undefined}
            onDelete={canDeleteSop ? (sop) => {
              setSopToDelete(sop);
              setIsDeleteDialogOpen(true);
            } : undefined}
          />
        )}
      </div>

      {/* Dialogs */}
      {canCreateSop && (
        <SopCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateSOP}
          categories={uniqueCategories}
        />
      )}
      
      {canEditSop && (
        <SopEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          sop={editingSop}
          users={users}
          onSubmit={(updatedSop) => editingSop && handleUpdateSOP(editingSop.id, updatedSop)}
        />
      )}
      
      {canDeleteSop && (
        <SopDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          sop={sopToDelete}
          onConfirm={() => sopToDelete && handleDeleteSOP(sopToDelete.id)}
        />
      )}
    </div>
  );
} 