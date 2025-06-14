import React from "react"
import { Download, Edit, User, Tag, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SOP, priorityColors, priorityLabels } from "../types"

interface ListViewProps {
  sops: SOP[]
  onViewDetails: (sop: SOP) => void
  onEdit?: (sop: SOP) => void
}

export function ListView({ sops, onViewDetails, onEdit }: ListViewProps) {
  return (
    <div className="space-y-4">
      {sops.map((sop) => (
        <Card key={sop.id} className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-semibold">{sop.title}</h3>
                  {sop.editedAt && (
                    <Badge variant="outline" className="text-xs bg-primary text-primary-foreground">
                      Modifié
                    </Badge>
                  )}
                  <Badge className={priorityColors[sop.priority.toLowerCase() as SOP["priority"]]}>
                    {priorityLabels[sop.priority.toLowerCase() as SOP["priority"]]}
                  </Badge>
                </div>
                {sop.description && (
                  <p 
                    className="text-muted-foreground mb-4"
                    dangerouslySetInnerHTML={{ __html: sop.description }}
                  />
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {sop.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {sop.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Créé le {new Date(sop.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                {sop.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sop.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewDetails(sop)}
                  className="flex items-center gap-1"
                >
                  Détails
                </Button>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(sop)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 