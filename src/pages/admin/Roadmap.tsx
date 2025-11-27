import DashboardLayout from "../../components/layout/DashboardLayout";
import { roadmapData, RoadmapPhase, TaskStatus } from "../../data/roadmapData";

export default function Roadmap() {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700 border-green-300";
      case "doing":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "todo":
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "✓";
      case "doing":
        return "⏳";
      case "todo":
        return "○";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "Pronto";
      case "doing":
        return "Fazendo";
      case "todo":
        return "A Fazer";
    }
  };

  const getPhaseProgress = (phase: RoadmapPhase) => {
    const completedTasks = phase.tasks.filter(
      (task) => task.status === "done"
    ).length;
    const totalTasks = phase.tasks.length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const getTotalProgress = () => {
    const allTasks = roadmapData.flatMap((phase) => phase.tasks);
    const completedTasks = allTasks.filter(
      (task) => task.status === "done"
    ).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };

  const getTotalStats = () => {
    const allTasks = roadmapData.flatMap((phase) => phase.tasks);
    return {
      total: allTasks.length,
      completed: allTasks.filter((task) => task.status === "done").length,
      inProgress: allTasks.filter((task) => task.status === "doing").length,
      notStarted: allTasks.filter((task) => task.status === "todo").length,
    };
  };

  const stats = getTotalStats();

  return (
    <DashboardLayout userType="admin">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Roadmap do Projeto MARIAH Copilot
          </h1>
          <p className="text-gray-600">
            Acompanhe o progresso de desenvolvimento do aplicativo de vistoria
            inteligente
          </p>
          <div className="mt-4 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-700">
              💡 <strong>Atenção Dev:</strong> Para atualizar o progresso, edite
              o arquivo{" "}
              <code className="bg-blue-100 px-2 py-0.5 rounded">
                src/data/roadmapData.ts
              </code>
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Progresso Geral
              </h2>
              <p className="text-sm text-gray-600">
                {stats.completed} de {stats.total} tarefas concluídas
              </p>
            </div>
            <div className="text-4xl font-bold text-primary">
              {getTotalProgress()}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-primary to-primary-dark h-full transition-all duration-500 rounded-full"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✓</div>
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.completed}
                  </div>
                  <div className="text-sm text-green-600">Prontas</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⏳</div>
                <div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.inProgress}
                  </div>
                  <div className="text-sm text-yellow-600">Em Andamento</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">○</div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {stats.notStarted}
                  </div>
                  <div className="text-sm text-gray-600">A Fazer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          {roadmapData.map((phase) => {
            const progress = getPhaseProgress(phase);
            const isCompleted = progress === 100;
            const hasStarted = phase.tasks.some(
              (t) => t.status === "done" || t.status === "doing"
            );

            return (
              <div
                key={phase.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  isCompleted
                    ? "border-green-300 bg-green-50/30"
                    : hasStarted
                    ? "border-yellow-300"
                    : "border-gray-200"
                }`}
              >
                {/* Phase Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{phase.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {phase.title}
                        </h3>
                        {isCompleted && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            ✓ Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">{phase.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isCompleted ? "bg-green-500" : "bg-primary"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-6">
                  <div className="space-y-3">
                    {phase.tasks.map((task) => {
                      return (
                        <div
                          key={task.id}
                          className={`rounded-lg p-4 border-2 transition-all ${
                            task.status === "done"
                              ? "bg-green-50 border-green-200"
                              : task.status === "doing"
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`text-2xl flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                task.status === "done"
                                  ? "bg-green-100 text-green-700"
                                  : task.status === "doing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {task.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {getStatusIcon(task.status)}{" "}
                                  {getStatusLabel(task.status)}
                                </span>
                                {task.status === "doing" && (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium">
                                      Em desenvolvimento
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
      </div>
    </DashboardLayout>
  );
}
