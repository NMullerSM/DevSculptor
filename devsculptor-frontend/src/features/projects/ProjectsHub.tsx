import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Project } from '@/types/project.types';

interface ProjectsHubProps {
  onOpenProject: (project: Project) => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({ onOpenProject }) => {
  const { projects, fetchProjects, isLoading, deleteProject } = useProjectStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.organization && p.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.lead_architect && p.lead_architect.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.architecture_style && p.architecture_style.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 max-w-6xl mx-auto w-full p-1 sm:p-2 z-10 fade-in overflow-y-auto custom-scrollbar">
      {/* Encabezado del Hub */}
      <div className="vision-window p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-primary tracking-tight">
            Portafolio de Arquitectura de Software
          </h1>
          <p className="text-[11px] sm:text-xs text-secondary mt-0.5 font-mono">
            Espacio de gobernanza técnica, trazabilidad y modelado relacional multi-inquilino.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vision-input !py-1.5 text-xs w-full sm:w-56 md:w-64"
          />
          <VisionButton
            variant="primary"
            icon="add"
            onClick={() => setIsCreateOpen(true)}
            className="justify-center shrink-0"
          >
            Nuevo Proyecto
          </VisionButton>
        </div>
      </div>

      {/* Grid de Proyectos */}
      {isLoading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vision-window p-5 h-48 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="vision-window p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/[0.04] border border-glass-subtle flex items-center justify-center text-muted">
            <span className="material-symbols-outlined text-2xl">folder_open</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-primary">No hay proyectos registrados</h3>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Inicializa tu primer proyecto de software para comenzar la captura de requisitos y el modelado ERD.
            </p>
          </div>
          <VisionButton
            variant="primary"
            icon="add"
            onClick={() => setIsCreateOpen(true)}
            className="mt-2"
          >
            Crear Primer Proyecto
          </VisionButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProjects.map((project) => {
            const isPendingArch =
              !project.architecture_style ||
              project.architecture_style === 'Por Definir / En Evaluación';

            return (
              <div
                key={project.id}
                className="vision-window p-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all cursor-pointer group"
                onClick={() => onOpenProject(project)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <VisionPill variant="indigo" dot>
                      ACTIVO
                    </VisionPill>
                    <span className="text-[10px] font-mono text-muted">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-primary group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                    {project.name}
                  </h3>

                  {(project.organization || project.lead_architect) && (
                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono text-muted">
                      {project.organization && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-indigo-400">domain</span>
                          <span>{project.organization}</span>
                        </span>
                      )}
                      {project.organization && project.lead_architect && <span>•</span>}
                      {project.lead_architect && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-cyan-400">badge</span>
                          <span>{project.lead_architect}</span>
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                    {project.description || 'Sin descripción técnica registrada.'}
                  </p>

                  <div className="pt-1">
                    {isPendingArch ? (
                      <span className="text-[10.5px] font-mono text-amber-500 dark:text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-[4px] border border-amber-400/20 inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pending</span>
                        <span>Arquitectura: En Evaluación</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-[4px] border border-cyan-400/20">
                        {project.architecture_style}
                      </span>
                    )}
                  </div>
                </div>

              <div className="pt-4 mt-4 border-t border-glass-subtle space-y-2.5">
                <div className="flex items-center justify-between">
                  <VisionButton
                    variant="default"
                    size="sm"
                    className="w-full justify-center group-hover:vision-btn-primary"
                  >
                    <span>Abrir Estudio de Gobernanza</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </VisionButton>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="ml-2 vision-btn vision-btn-icon text-muted hover:text-indigo-300 shrink-0"
                    title="Editar metadatos del proyecto"
                  >
                    <span className="material-symbols-outlined text-xs">tune</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    className="ml-1 vision-btn vision-btn-icon text-muted hover:text-rose-400 shrink-0"
                    title="Eliminar proyecto"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Nuevo Proyecto */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchProjects()}
      />

      {/* Modal Editar Proyecto */}
      <EditProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onUpdated={() => fetchProjects()}
      />

      {/* Diálogo Confirmar Eliminación */}
      <ConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={async () => {
          if (deletingProject) {
            await deleteProject(deletingProject.id);
            await fetchProjects();
          }
        }}
        title="Eliminar Proyecto y Artefactos"
        description={`¿Estás seguro de eliminar el proyecto "${deletingProject?.name}"? Esta acción purgará de forma atómica en cascada todos sus requisitos IEEE-830, entidades relacionales del Canvas y actas de decisión ADR asociadas.`}
        confirmText="Eliminar Proyecto"
        variant="danger"
        requireConfirmationTicket={true}
        confirmationTicketText="Confirmo que deseo eliminar este proyecto y todos sus artefactos asociados de forma irreversible."
      />
    </div>
  );
};
