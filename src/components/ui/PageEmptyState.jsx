import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function PageEmptyState({
  icon: Icon = Layers,
  title = "Nenhum Projeto Selecionado",
  description = "Selecione um projeto na barra lateral para continuar.",
}) {
  return (
    <div className="p-8">
      <Card className="border-brand-primary/20 bg-brand-primary/5 max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Icon className="w-14 h-14 mx-auto mb-4 text-brand-accent" />
          <h3 className="text-xl font-semibold text-brand-primary mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
