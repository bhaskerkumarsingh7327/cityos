import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Globe2,
  HardHat,
  Layers,
  MapPin,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHealthCheck } from "@/lib/hooks/useHealthCheck";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Incident, IncidentPriority, IncidentStatus, UserRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Realistic Seed / Offline Fallback Incidents so all 4 portals are immediately interactive
const INITIAL_DEMO_INCIDENTS: Incident[] = [
  {
    id: "inc-seed-001",
    incidentNumber: "INC-202611-001",
    title: "Deep pothole near 80ft Road Junction",
    description:
      "Severe pothole causing two-wheelers to skid, approximately 2 feet wide with exposed sub-base.",
    status: "REPORTED",
    priority: "HIGH",
    priorityScore: 82,
    priorityFactors: {
      severityScore: 80,
      safetyScore: 90,
      repeatFactor: 60,
      unresolvedAgingScore: 70,
      explanation: "High vehicle density route + deep pothole creates imminent accident hazard.",
    },
    aiAnalysis: {
      category: "pothole",
      confidence: 0.94,
      severity: "HIGH",
      detectedObjects: ["pothole_crater", "asphalt_crack"],
      processedAt: new Date().toISOString(),
    },
    location: {
      type: "Point",
      coordinates: [77.6012, 12.9754],
    },
    address: "80ft Road, Near Metro Pillar 42, Ward 101",
    category: {
      id: "cat-1",
      name: "Pothole & Road Damage",
      slug: "pothole",
      description: "Potholes and cracked asphalt",
      defaultSeverity: "HIGH",
      slaHours: 24,
    },
    department: {
      id: "dept-1",
      name: "Public Works Department (Roads)",
      code: "PWD",
      description: "Roads and Infrastructure",
    },
    media: [
      {
        mediaId: "m1",
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
        mimeType: "image/jpeg",
        phase: "initial",
        uploadedAt: new Date().toISOString(),
      },
    ],
    statusHistory: [
      {
        fromStatus: "REPORTED",
        toStatus: "REPORTED",
        changedBy: { id: "u-cit", name: "Aarav Sharma", role: "CITIZEN" },
        reason: "Citizen initial report submitted via CityOS",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inc-seed-002",
    incidentNumber: "INC-202611-002",
    title: "Broken streetlight causing dark pedestrian stretch",
    description:
      "Three consecutive streetlights are completely off, creating pedestrian safety risk after 7 PM.",
    status: "ASSIGNED",
    priority: "MEDIUM",
    priorityScore: 65,
    priorityFactors: {
      severityScore: 60,
      safetyScore: 70,
      repeatFactor: 40,
      unresolvedAgingScore: 50,
      explanation: "Pedestrian safety concern in residential neighborhood.",
    },
    aiAnalysis: {
      category: "streetlight",
      confidence: 0.89,
      severity: "MEDIUM",
      detectedObjects: ["dark_luminaire", "damaged_cable"],
      processedAt: new Date().toISOString(),
    },
    location: {
      type: "Point",
      coordinates: [77.6415, 12.9782],
    },
    address: "12th Main, 4th Cross, Indiranagar, Ward 102",
    category: {
      id: "cat-2",
      name: "Broken Streetlight & Dark Spot",
      slug: "streetlight",
      description: "Non-functional streetlight",
      defaultSeverity: "MEDIUM",
      slaHours: 48,
    },
    department: {
      id: "dept-2",
      name: "Streetlight & Electrical Infrastructure",
      code: "ELEC",
      description: "Electrical Assets",
    },
    assignedWorker: {
      id: "demo-field_worker-id",
      name: "Ramesh Kumar (Field Tech)",
      email: "worker.pwd@cityos.local",
      role: "FIELD_WORKER",
    },
    media: [
      {
        mediaId: "m2",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
        mimeType: "image/jpeg",
        phase: "initial",
        uploadedAt: new Date().toISOString(),
      },
    ],
    statusHistory: [
      {
        fromStatus: "REPORTED",
        toStatus: "VERIFIED",
        changedBy: { id: "u-off", name: "PWD Nodal Officer", role: "OFFICER" },
        reason: "Officer verified incident report",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        fromStatus: "VERIFIED",
        toStatus: "ASSIGNED",
        changedBy: { id: "u-off", name: "PWD Nodal Officer", role: "OFFICER" },
        reason: "Assigned to Ramesh Kumar (Field Tech)",
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inc-seed-003",
    incidentNumber: "INC-202611-003",
    title: "Major water pipeline leak flooding road",
    description:
      "Fresh water main burst, clean water gushing onto the carriageway, blocking traffic.",
    status: "RESOLVED",
    priority: "CRITICAL",
    priorityScore: 88,
    priorityFactors: {
      severityScore: 90,
      safetyScore: 85,
      repeatFactor: 80,
      unresolvedAgingScore: 60,
      explanation: "Substantial water wastage and road foundation erosion risk.",
    },
    aiAnalysis: {
      category: "water-leak",
      confidence: 0.95,
      severity: "CRITICAL",
      detectedObjects: ["water_logging", "burst_pipeline"],
      processedAt: new Date().toISOString(),
    },
    location: {
      type: "Point",
      coordinates: [77.6105, 12.9812],
    },
    address: "Commercial Street Cross, Ward 101",
    category: {
      id: "cat-3",
      name: "Water Main Leakage & Open Drain",
      slug: "water-leak",
      description: "Drinking water pipeline leak",
      defaultSeverity: "HIGH",
      slaHours: 12,
    },
    department: {
      id: "dept-3",
      name: "Water Supply & Sewerage Board",
      code: "WSSB",
      description: "Water Supply",
    },
    resolution: {
      resolvedAt: new Date().toISOString(),
      resolutionNotes: "Main valve isolated, ruptured coupling replaced and asphalt leveled.",
    },
    media: [
      {
        mediaId: "m3",
        url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
        mimeType: "image/jpeg",
        phase: "after",
        uploadedAt: new Date().toISOString(),
      },
    ],
    statusHistory: [
      {
        fromStatus: "IN_PROGRESS",
        toStatus: "RESOLVED",
        changedBy: { id: "u-work", name: "Ramesh Kumar", role: "FIELD_WORKER" },
        reason: "Coupling repaired by technician, awaiting citizen confirmation",
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTED: "bg-blue-100 text-blue-800 border-blue-200",
  AI_PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  UNDER_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  VERIFIED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ASSIGNED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CITIZEN_VERIFICATION: "bg-teal-100 text-teal-800 border-teal-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-300",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  REOPENED: "bg-orange-100 text-orange-800 border-orange-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PRIORITY_COLORS: Record<IncidentPriority, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-amber-500 text-white",
  MEDIUM: "bg-blue-500 text-white",
  LOW: "bg-slate-500 text-white",
};

export default function App() {
  const queryClient = useQueryClient();
  const { user, switchDemoRole } = useAuthStore();
  const { data: healthData } = useHealthCheck();

  // Active Role is driven by useAuthStore: "CITIZEN" | "OFFICER" | "FIELD_WORKER" | "CITY_ADMIN"
  const currentRole = user?.role || "CITIZEN";

  // Navigation tab state inside the active portal
  const [activeTab, setActiveTab] = useState<string>("default");

  // Local state for interactive fallback manipulation
  const [localIncidents, setLocalIncidents] = useState<Incident[]>(INITIAL_DEMO_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(() => {
    if (currentRole === "FIELD_WORKER") {
      return (
        INITIAL_DEMO_INCIDENTS.find(
          (i) => i.status === "ASSIGNED" || i.status === "IN_PROGRESS",
        ) || INITIAL_DEMO_INCIDENTS[0]
      );
    }
    return INITIAL_DEMO_INCIDENTS[0];
  });

  // Citizen Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("pothole");
  const [formLng, setFormLng] = useState("77.6012");
  const [formLat, setFormLat] = useState("12.9754");
  const [formAddress, setFormAddress] = useState("MG Road Junction, Ward 101");
  const [formMediaUrl, setFormMediaUrl] = useState(
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
  );

  // Field Worker Evidence Submission State (Mandatory Photos & Notes)
  const [workerBeforePhoto, setWorkerBeforePhoto] = useState(
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
  );
  const [workerBeforeNotes, setWorkerBeforeNotes] = useState(
    "Arrived on site with repair crew, asphalt mix, and compaction roller",
  );
  const [workerAfterPhoto, setWorkerAfterPhoto] = useState(
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
  );
  const [workerAfterNotes, setWorkerAfterNotes] = useState(
    "Pothole filled with 2 layers of compacted asphalt, leveled and sealed with cold-pour emulsion",
  );

  // Server Queries
  const {
    data: serverIncidentsData,
    refetch: refetchIncidents,
    isFetching,
  } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.getIncidents(),
    retry: false,
  });

  const { data: analyticsOverview } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.getAnalyticsOverview(),
    retry: false,
  });

  // Combine server data with local demo list
  const incidentsList =
    serverIncidentsData?.incidents && serverIncidentsData.incidents.length > 0
      ? serverIncidentsData.incidents
      : localIncidents;

  // Mutation to create incident
  const createIncidentMutation = useMutation({
    mutationFn: api.createIncident,
    onSuccess: (newInc) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setLocalIncidents((prev) => [newInc, ...prev]);
      setSelectedIncident(newInc);
      setFormTitle("");
      setFormDescription("");
      alert("Incident successfully reported to CityOS and routed to Department!");
    },
    onError: () => {
      // Local demo fallback if backend is offline
      const newDemoInc: Incident = {
        id: `inc-${Date.now()}`,
        incidentNumber: `INC-202611-${Math.floor(100 + Math.random() * 900)}`,
        title: formTitle,
        description: formDescription,
        status: "REPORTED",
        priority: "HIGH",
        priorityScore: 78,
        location: {
          type: "Point",
          coordinates: [parseFloat(formLng), parseFloat(formLat)],
        },
        address: formAddress,
        category: {
          id: "cat-new",
          name: formCategory === "pothole" ? "Pothole & Road Damage" : "Broken Streetlight",
          slug: formCategory,
          description: "Urban problem",
          defaultSeverity: "HIGH",
          slaHours: 24,
        },
        department: {
          id: "dept-pwd",
          name: "Public Works Department (Roads)",
          code: "PWD",
          description: "Roads Infrastructure",
        },
        aiAnalysis: {
          category: formCategory,
          confidence: 0.92,
          severity: "HIGH",
          detectedObjects: ["pothole_crater"],
          processedAt: new Date().toISOString(),
        },
        media: [
          {
            mediaId: `m-${Date.now()}`,
            url: formMediaUrl,
            mimeType: "image/jpeg",
            phase: "initial",
            uploadedAt: new Date().toISOString(),
          },
        ],
        statusHistory: [
          {
            fromStatus: "REPORTED",
            toStatus: "REPORTED",
            changedBy: { id: "cit", name: user?.name || "Citizen", role: "CITIZEN" },
            reason: "Reported via Citizen Portal",
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalIncidents((prev) => [newDemoInc, ...prev]);
      setSelectedIncident(newDemoInc);
      setFormTitle("");
      setFormDescription("");
      alert("Incident reported successfully! Routed to PWD Nodal Officer Desk.");
    },
  });

  const handleStatusTransition = async (targetStatus: IncidentStatus, reason: string) => {
    if (!selectedIncident) return;

    try {
      await api.updateStatus(selectedIncident.id, targetStatus, reason);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    } catch {
      // Handled seamlessly with local state sync
    }

    const updated = {
      ...selectedIncident,
      status: targetStatus,
      statusHistory: [
        ...selectedIncident.statusHistory,
        {
          fromStatus: selectedIncident.status,
          toStatus: targetStatus,
          changedBy: { id: user?.id || "u", name: user?.name || "User", role: currentRole },
          reason,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setLocalIncidents((prev) =>
      prev.map((inc) => (inc.id === selectedIncident.id ? updated : inc)),
    );
    setSelectedIncident(updated);
  };

  const handleWorkerStartWork = async () => {
    if (!selectedIncident) return;
    if (!workerBeforePhoto.trim()) {
      alert("Error: Before-repair photo proof is mandatory before starting work!");
      return;
    }

    try {
      await api.startWork(selectedIncident.id, workerBeforePhoto, workerBeforeNotes);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    } catch {
      // Local fallback
    }

    const updated: Incident = {
      ...selectedIncident,
      status: "IN_PROGRESS",
      media: [
        ...selectedIncident.media,
        {
          mediaId: `m-before-${Date.now()}`,
          url: workerBeforePhoto,
          mimeType: "image/jpeg",
          phase: "before",
          uploadedAt: new Date().toISOString(),
        },
      ],
      statusHistory: [
        ...selectedIncident.statusHistory,
        {
          fromStatus: selectedIncident.status,
          toStatus: "IN_PROGRESS",
          changedBy: { id: user?.id || "w", name: user?.name || "Ramesh Kumar", role: "FIELD_WORKER" },
          reason: workerBeforeNotes || "Arrived on-site with Before-photo evidence",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setLocalIncidents((prev) => prev.map((inc) => (inc.id === selectedIncident.id ? updated : inc)));
    setSelectedIncident(updated);
    alert("Work started! Before-repair photographic evidence recorded.");
  };

  const handleWorkerCompleteWork = async () => {
    if (!selectedIncident) return;
    if (!workerAfterPhoto.trim()) {
      alert("Error: After-repair photo proof is mandatory! Without photographic evidence, work completion cannot be submitted.");
      return;
    }
    if (!workerAfterNotes.trim() || workerAfterNotes.trim().length < 10) {
      alert("Error: Detailed resolution notes (minimum 10 characters) are mandatory to explain what was repaired!");
      return;
    }

    try {
      await api.completeWork(selectedIncident.id, workerAfterPhoto, workerAfterNotes);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    } catch {
      // Local fallback
    }

    const updated: Incident = {
      ...selectedIncident,
      status: "RESOLVED",
      resolution: {
        resolvedAt: new Date().toISOString(),
        resolutionNotes: workerAfterNotes,
      },
      media: [
        ...selectedIncident.media,
        {
          mediaId: `m-after-${Date.now()}`,
          url: workerAfterPhoto,
          mimeType: "image/jpeg",
          phase: "after",
          uploadedAt: new Date().toISOString(),
        },
      ],
      statusHistory: [
        ...selectedIncident.statusHistory,
        {
          fromStatus: selectedIncident.status,
          toStatus: "RESOLVED",
          changedBy: { id: user?.id || "w", name: user?.name || "Ramesh Kumar", role: "FIELD_WORKER" },
          reason: `Work completed by technician with after-photo proof. Notes: ${workerAfterNotes}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setLocalIncidents((prev) => prev.map((inc) => (inc.id === selectedIncident.id ? updated : inc)));
    setSelectedIncident(updated);
    alert("Work completion submitted with After-repair photo proof! Forwarded to Citizen for final verification.");
  };

  const handleAssignWorker = async (workerName: string) => {
    if (!selectedIncident) return;
    const targetStatus: IncidentStatus = "ASSIGNED";
    const reason = `Assigned by Officer to ${workerName} (PWD Maintenance Crew)`;

    try {
      await api.assignIncident(selectedIncident.id);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    } catch {
      // Local fallback
    }

    const updated: Incident = {
      ...selectedIncident,
      status: targetStatus,
      assignedWorker: {
        id: "demo-field_worker-id",
        name: workerName,
        email: "worker.pwd@cityos.local",
        role: "FIELD_WORKER",
      },
      statusHistory: [
        ...selectedIncident.statusHistory,
        {
          fromStatus: selectedIncident.status,
          toStatus: targetStatus,
          changedBy: { id: user?.id || "u", name: user?.name || "Officer", role: "OFFICER" },
          reason,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setLocalIncidents((prev) =>
      prev.map((inc) => (inc.id === selectedIncident.id ? updated : inc)),
    );
    setSelectedIncident(updated);
  };

  // Switch role and reset tab to role's primary view
  const handleRoleChange = (newRole: UserRole) => {
    switchDemoRole(newRole);
    setActiveTab("default");
    // Auto-select relevant incident for the role
    if (newRole === "FIELD_WORKER") {
      const assigned = incidentsList.find(
        (i) => i.status === "ASSIGNED" || i.status === "IN_PROGRESS",
      );
      if (assigned) setSelectedIncident(assigned);
    } else if (newRole === "CITIZEN") {
      const resolved = incidentsList.find((i) => i.status === "RESOLVED");
      if (resolved) setSelectedIncident(resolved);
    } else {
      setSelectedIncident(incidentsList[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner & Role Selector */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">CityOS</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    currentRole === "CITIZEN"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : currentRole === "OFFICER"
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : currentRole === "FIELD_WORKER"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-purple-50 text-purple-800 border-purple-300"
                  }`}
                >
                  {currentRole === "CITIZEN" && "Citizen Portal (Nagrik)"}
                  {currentRole === "OFFICER" && "Nodal Officer Desk (PWD)"}
                  {currentRole === "FIELD_WORKER" && "Field Worker Work-Orders"}
                  {currentRole === "CITY_ADMIN" && "City Executive Command"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Logged in as: <strong className="text-slate-800">{user?.name}</strong> (
                {user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend connection pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${healthData?.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                />
                Backend: {healthData?.status === "ok" ? "Online" : "Demo Mode"}
              </span>
            </div>

            {/* PORTAL SELECTOR */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-300">
              <label htmlFor="role-select" className="text-xs font-semibold text-slate-700 pl-2">
                Portal:
              </label>
              <select
                id="role-select"
                aria-label="Select Portal Role"
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
              >
                <option value="CITIZEN">1. Nagrik (Citizen Portal)</option>
                <option value="OFFICER">2. Nodal Officer (PWD Desk)</option>
                <option value="FIELD_WORKER">3. Field Worker (Ground Tech)</option>
                <option value="CITY_ADMIN">4. City Admin (Commissioner)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs that change completely for each Portal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-100 overflow-x-auto bg-slate-50/50">
          {/* CITIZEN PORTAL TABS */}
          {currentRole === "CITIZEN" && (
            <>
              <button
                onClick={() => setActiveTab("default")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "default"
                    ? "border-emerald-600 text-emerald-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> My Complaints & Status ({incidentsList.length})
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "report"
                    ? "border-emerald-600 text-emerald-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> + Report New Problem
              </button>
              <button
                onClick={() => setActiveTab("verification")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "verification"
                    ? "border-emerald-600 text-emerald-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Resolution Approvals
              </button>
            </>
          )}

          {/* OFFICER PORTAL TABS */}
          {currentRole === "OFFICER" && (
            <>
              <button
                onClick={() => setActiveTab("default")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "default"
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Department Review Queue (Verify & Assign)
              </button>
              <button
                onClick={() => setActiveTab("assigned")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "assigned"
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <HardHat className="w-3.5 h-3.5 text-cyan-600" /> Active Ground Dispatches
              </button>
              <button
                onClick={() => setActiveTab("hotspots")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "hotspots"
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-600" /> PWD Ward Hotspots
              </button>
            </>
          )}

          {/* FIELD WORKER PORTAL TABS */}
          {currentRole === "FIELD_WORKER" && (
            <>
              <button
                onClick={() => setActiveTab("default")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "default"
                    ? "border-amber-600 text-amber-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600" /> My Assigned Work Orders (Ground
                View)
              </button>
            </>
          )}

          {/* CITY ADMIN PORTAL TABS */}
          {currentRole === "CITY_ADMIN" && (
            <>
              <button
                onClick={() => setActiveTab("default")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "default"
                    ? "border-purple-600 text-purple-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" /> City-Wide Executive Analytics
              </button>
              <button
                onClick={() => setActiveTab("gis")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === "gis"
                    ? "border-purple-600 text-purple-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-blue-600" /> GIS 2dsphere Grid & Density
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Portal View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ========================================================================= */}
        {/* PORTAL 1: CITIZEN PORTAL (NAGRIK)                                         */}
        {/* ========================================================================= */}
        {currentRole === "CITIZEN" && (
          <div className="space-y-6">
            {/* Portal Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-700" /> Nagrik Seva Portal (Citizen
                  Dashboard)
                </h1>
                <p className="text-xs text-emerald-800">
                  Shehar ki sadak, kachra, bijli ya paani ki samasya report karein aur resolution
                  verify karein.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("report")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" /> Nayi Samasya Report Karein
              </button>
            </div>

            {/* TAB: Report Form */}
            {activeTab === "report" ? (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
                <div className="border-b pb-3">
                  <h2 className="text-base font-bold text-slate-900">Naya Incident Darj Karein</h2>
                  <p className="text-xs text-slate-500">
                    Aapki report submit hote hi AI photo analyze karega aur sambhadhit Department
                    Officer ke desk par bhejega.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createIncidentMutation.mutate({
                      title: formTitle,
                      description: formDescription,
                      category: formCategory,
                      coordinates: [parseFloat(formLng), parseFloat(formLat)],
                      address: formAddress,
                      mediaUrl: formMediaUrl,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Samasya Ka Category Chunein
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium"
                    >
                      <option value="pothole">
                        Sadak Ka Khadda (Pothole) ➔ PWD Roads Department
                      </option>
                      <option value="garbage">
                        Kachre Ka Dher (Garbage Dump) ➔ Sanitation Department
                      </option>
                      <option value="water-leak">
                        Paani Ki Pipeline Leakage ➔ Water Board (WSSB)
                      </option>
                      <option value="streetlight">
                        Kharaab Streetlight / Andhera ➔ Electrical Department
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. 80ft Road Junction par bada khadda"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pura Vivaran (Description)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Samasya kitni gambhir hai aur safety hazard kya hai..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={formLng}
                        onChange={(e) => setFormLng(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={formLat}
                        onChange={(e) => setFormLat(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Photo Evidence URL (AI ke liye)
                    </label>
                    <input
                      type="url"
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={createIncidentMutation.isPending}
                      className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-md text-sm hover:bg-emerald-700"
                    >
                      Report Submit Karein
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("default")}
                      className="px-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* TAB: Citizen Complaint Tracking & Resolution Approvals */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      Aapki Darj Ki Gayi Complaints ({incidentsList.length})
                    </span>
                    <button
                      onClick={() => refetchIncidents()}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />{" "}
                      Refresh
                    </button>
                  </div>

                  {incidentsList.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`bg-white p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedIncident?.id === inc.id
                          ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {inc.incidentNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[inc.status]}`}
                            >
                              {inc.status.replace("_", " ")}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PRIORITY_COLORS[inc.priority]}`}
                            >
                              {inc.priority}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
                          <p className="text-xs text-slate-600">{inc.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {inc.address || "Location Pinned"}
                        </span>
                        <span className="font-medium text-emerald-700">
                          Assigned: {inc.department?.name || "PWD Roads"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Citizen Action Panel (Accept/Reject if Resolved) */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 sticky top-24">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Complaint Details & Action
                    </h3>

                    {selectedIncident ? (
                      <>
                        <div>
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {selectedIncident.incidentNumber}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {selectedIncident.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {selectedIncident.description}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded border text-xs space-y-1">
                          <div className="text-slate-500">Current Status:</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {selectedIncident.status.replace("_", " ")}
                          </div>
                          {selectedIncident.status === "REPORTED" && (
                            <p className="text-slate-500 text-[11px]">
                              Report submit ho gayi hai. Officer review karke field technician ko
                              bhej raha hai.
                            </p>
                          )}
                          {selectedIncident.status === "ASSIGNED" && (
                            <p className="text-blue-700 text-[11px] font-medium">
                              Field Worker (Ramesh) ko repair ka task assign ho gaya hai.
                            </p>
                          )}
                          {selectedIncident.status === "RESOLVED" && (
                            <p className="text-emerald-700 text-[11px] font-bold">
                              Technician ne repair complete kar diya hai! Kripya apna verification
                              dein.
                            </p>
                          )}
                        </div>

                        {/* Citizen Verification & Resolution Review */}
                        {selectedIncident.status === "RESOLVED" ? (
                          <div className="border border-emerald-300 bg-emerald-50 p-4 rounded-lg space-y-3.5">
                            <div>
                              <span className="text-xs font-bold text-emerald-950 block">
                                Field Worker Verification & Proof Submitted:
                              </span>
                              <p className="text-[11px] text-emerald-800">
                                Ground technician ne kaam poora karke photographic evidence upload kiya hai. Kripya check karein:
                              </p>
                            </div>

                            {/* Before vs After Photo Proof */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="border border-slate-200 bg-white rounded p-1.5 shadow-xs">
                                <span className="font-bold text-slate-700 block mb-1">
                                  1. Complaint / Before Photo:
                                </span>
                                {selectedIncident.media?.find(
                                  (m) => m.phase === "before" || m.phase === "initial",
                                )?.url ? (
                                  <img
                                    src={
                                      selectedIncident.media.find(
                                        (m) => m.phase === "before" || m.phase === "initial",
                                      )!.url
                                    }
                                    alt="Before Repair"
                                    className="w-full h-24 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400">
                                    Initial Photo
                                  </div>
                                )}
                              </div>

                              <div className="border border-emerald-300 bg-white rounded p-1.5 shadow-xs">
                                <span className="font-bold text-emerald-800 block mb-1">
                                  2. Worker's Repaired Photo (Proof):
                                </span>
                                {selectedIncident.media?.find((m) => m.phase === "after")?.url ? (
                                  <img
                                    src={
                                      selectedIncident.media.find((m) => m.phase === "after")!.url
                                    }
                                    alt="Repaired Evidence"
                                    className="w-full h-24 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-24 bg-emerald-50 flex items-center justify-center text-emerald-600 font-medium">
                                    Evidence Photo
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedIncident.resolution?.resolutionNotes && (
                              <div className="text-[11px] bg-white p-2.5 rounded border border-emerald-200 text-slate-700">
                                <strong className="text-emerald-900 block text-[10px]">
                                  Technician's Resolution Report:
                                </strong>
                                {selectedIncident.resolution.resolutionNotes}
                              </div>
                            )}

                            <div className="border-t border-emerald-200 pt-2 space-y-2">
                              <span className="text-xs font-bold text-slate-800 block">
                                Kya aap is repair kaam se santusht hain?
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusTransition(
                                      "CLOSED",
                                      "Citizen verified photographic proof and accepted the repair.",
                                    )
                                  }
                                  className="flex-1 py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Haan, Accept & Close
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusTransition(
                                      "REOPENED",
                                      "Citizen rejected resolution - photographic evidence unsatisfactory.",
                                    )
                                  }
                                  className="flex-1 py-2 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Reject & Reopen
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 text-center py-2">
                            Resolution complete hone par yahan verification buttons active honge.
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Kisi complaint par click karein.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 2: NODAL OFFICER PORTAL (PWD DESK)                                 */}
        {/* ========================================================================= */}
        {currentRole === "OFFICER" && (
          <div className="space-y-6">
            {/* Officer Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-blue-950 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-700" /> Nodal Officer Command Desk (PWD Roads
                  & Infrastructure)
                </h1>
                <p className="text-xs text-blue-800">
                  Nagrikon dwara aayi nayi complaints ko AI confidence ke sath verify karein aur
                  Field Worker ko assign karein.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md">
                Officer Desk: Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Incoming Complaints Queue */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    Incoming Reports Queue for PWD ({incidentsList.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    Click to Inspect AI Confidence & Assign
                  </span>
                </div>

                {incidentsList.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`bg-white p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedIncident?.id === inc.id
                        ? "border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {inc.incidentNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[inc.status]}`}
                          >
                            {inc.status.replace("_", " ")}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PRIORITY_COLORS[inc.priority]}`}
                          >
                            {inc.priority} ({inc.priorityScore}pts)
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
                        <p className="text-xs text-slate-600">{inc.description}</p>
                      </div>

                      {inc.aiAnalysis && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>AI: {Math.round(inc.aiAnalysis.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-100">
                      <span>{inc.address}</span>
                      <span className="font-mono text-blue-700 font-semibold">
                        {inc.assignedWorker
                          ? `Worker: ${inc.assignedWorker.name}`
                          : "Not Assigned Yet"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Officer Action Controls */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5 sticky top-24">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Officer Decision & Assignment Desk
                  </h3>

                  {selectedIncident ? (
                    <>
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {selectedIncident.incidentNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {selectedIncident.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedIncident.description}
                        </p>
                      </div>

                      {/* AI Detection Summary */}
                      <div className="bg-purple-50 p-3 rounded border border-purple-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-purple-900 font-bold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Computer Vision
                            Inspection
                          </span>
                          <span>
                            {selectedIncident.aiAnalysis?.confidence
                              ? Math.round(selectedIncident.aiAnalysis.confidence * 100)
                              : 94}
                            %
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-800">
                          Detected:{" "}
                          <strong>
                            {selectedIncident.aiAnalysis?.detectedObjects?.join(", ") ||
                              "pothole_crater"}
                          </strong>
                          . Severity: <strong>{selectedIncident.priority}</strong>
                        </p>
                      </div>

                      {/* OFFICER ACTIONS */}
                      <div className="border-t pt-4 space-y-3">
                        <span className="text-xs font-bold text-slate-800 block">
                          Officer Actions:
                        </span>

                        {/* Action 1: Verify */}
                        {selectedIncident.status === "REPORTED" && (
                          <button
                            onClick={() =>
                              handleStatusTransition(
                                "VERIFIED",
                                "Officer inspected and verified report as genuine PWD issue.",
                              )
                            }
                            className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> 1. Verify Report
                          </button>
                        )}

                        {/* Action 2: Assign Field Worker */}
                        {(selectedIncident.status === "VERIFIED" ||
                          selectedIncident.status === "REPORTED") && (
                          <div className="space-y-2 bg-slate-50 p-3 rounded border">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Select Ground Worker to Dispatch:
                            </label>
                            <select
                              id="worker-select"
                              className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-medium"
                              defaultValue="Ramesh Kumar (Field Tech)"
                            >
                              <option value="Ramesh Kumar (Field Tech)">
                                Ramesh Kumar (Ward 101 Technician)
                              </option>
                              <option value="Suresh Yadav (Roads)">
                                Suresh Yadav (Asphalt Repair Crew)
                              </option>
                            </select>
                            <button
                              onClick={() => handleAssignWorker("Ramesh Kumar (Field Tech)")}
                              className="w-full py-2 bg-cyan-600 text-white rounded-md text-xs font-bold hover:bg-cyan-700 flex items-center justify-center gap-1.5"
                            >
                              <HardHat className="w-4 h-4" /> 2. Dispatch Field Worker
                            </button>
                          </div>
                        )}

                        {selectedIncident.status === "ASSIGNED" && (
                          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-800 font-medium text-center">
                            ✓ Assigned to {selectedIncident.assignedWorker?.name || "Ramesh Kumar"}.
                            Worker has received the task.
                          </div>
                        )}

                        {selectedIncident.status === "RESOLVED" && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium text-center">
                            Worker has finished repair. Ticket is currently with the Citizen for
                            final verification.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Kisi incident par click karein.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 3: FIELD WORKER PORTAL (GROUND TECHNICIAN)                         */}
        {/* ========================================================================= */}
        {currentRole === "FIELD_WORKER" && (
          <div className="space-y-6">
            {/* Worker Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-700" /> Field Technician Work Orders
                  (Ground Operations)
                </h1>
                <p className="text-xs text-amber-800">
                  Aapko assign kiye gaye repair tasks. Spot par jakar pehle Before-photo aur kaam ke
                  baad After-photo submit karein.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-md">
                Worker: Ramesh Kumar
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task list */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    Aapke Assigned Tasks (
                    {incidentsList.filter((i) => i.status !== "CLOSED").length})
                  </span>
                  <span className="text-xs text-slate-500">Click to start or complete work</span>
                </div>

                {incidentsList.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`bg-white p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedIncident?.id === inc.id
                        ? "border-amber-600 ring-2 ring-amber-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {inc.incidentNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[inc.status]}`}
                          >
                            {inc.status.replace("_", " ")}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PRIORITY_COLORS[inc.priority]}`}
                          >
                            {inc.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
                        <p className="text-xs text-slate-600">{inc.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-100">
                      <span className="font-medium text-amber-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {inc.address}
                      </span>
                      <span className="font-mono font-semibold text-slate-700">
                        Coordinates: [{inc.location.coordinates[0]}, {inc.location.coordinates[1]}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Worker Action Box */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5 sticky top-24">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Field Repair Execution
                  </h3>

                  {selectedIncident ? (
                    <>
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-700">
                          {selectedIncident.incidentNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {selectedIncident.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedIncident.description}
                        </p>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <span className="text-xs font-bold text-slate-800 block">
                          Repair Workflow:
                        </span>

                        {/* Step 1: Start Repair (Mandatory Arrival & Before-Photo) */}
                        {selectedIncident.status === "ASSIGNED" && (
                          <div className="space-y-3 bg-amber-50/70 p-3.5 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                              <Camera className="w-4 h-4 text-amber-600" />
                              <span>Step 1: Arrival Proof (Mandatory Before-Photo)</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Repair shuru karne se pehle spot par pahunchne ka photographic proof anivarya (mandatory) hai.
                            </p>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                <span>Before-Repair Photo URL: <span className="text-red-500">*</span></span>
                                {workerBeforePhoto.trim() ? (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Photo Attached
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-red-500 font-bold">Required</span>
                                )}
                              </label>
                              <input
                                type="url"
                                value={workerBeforePhoto}
                                onChange={(e) => setWorkerBeforePhoto(e.target.value)}
                                placeholder="https://example.com/site-arrival.jpg"
                                className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />

                              {/* Sample preset links */}
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-slate-500">Sample Photo:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkerBeforePhoto(
                                      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
                                    )
                                  }
                                  className="text-amber-800 underline hover:text-amber-950"
                                >
                                  [Road Pothole Photo]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWorkerBeforePhoto("")}
                                  className="text-red-600 underline hover:text-red-800 ml-auto"
                                >
                                  Clear
                                </button>
                              </div>

                              {workerBeforePhoto.trim() ? (
                                <div className="mt-1.5 relative rounded overflow-hidden border border-amber-300 bg-black max-h-36 flex items-center justify-center">
                                  <img
                                    src={workerBeforePhoto}
                                    alt="Before Repair Proof"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src =
                                        "https://placehold.co/600x400?text=Invalid+Image+URL";
                                    }}
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                    Before-Photo Proof
                                  </span>
                                </div>
                              ) : (
                                <div className="p-2 border border-dashed border-red-300 bg-red-50/50 rounded text-center text-[10px] text-red-600">
                                  Photo URL khali hai. Kripya arrival photo proof enter karein.
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">
                                Arrival & Assessment Notes:
                              </label>
                              <input
                                type="text"
                                value={workerBeforeNotes}
                                onChange={(e) => setWorkerBeforeNotes(e.target.value)}
                                placeholder="e.g. Arrived on site with repair crew and equipment"
                                className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>

                            {!workerBeforePhoto.trim() && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 font-medium flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                <span>Bina Before-photo proof ke repair shuru nahi ho sakti.</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleWorkerStartWork}
                              disabled={!workerBeforePhoto.trim()}
                              className={`w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                workerBeforePhoto.trim()
                                  ? "bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-sm"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                              }`}
                            >
                              <Wrench className="w-4 h-4" /> 1. Verify Arrival & Start Work
                            </button>
                          </div>
                        )}

                        {/* Step 2: Complete Repair (Strict Evidence Verification) */}
                        {selectedIncident.status === "IN_PROGRESS" && (
                          <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-300">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                              <Camera className="w-4 h-4 text-emerald-600" />
                              <span>Step 2: Mandatory Photographic Evidence</span>
                            </div>

                            <div className="p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 font-medium">
                              ⚠️ <strong>Strict Rule:</strong> Bina After-photo proof aur detailed resolution notes (min. 10 chars) ke submission system lock rahega. Koi bhi bina evidence ke complete nahi kar sakta.
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                <span>After-Repair Photo URL: <span className="text-red-500">*</span></span>
                                {workerAfterPhoto.trim() ? (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Evidence Attached
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-red-500 font-bold">Mandatory</span>
                                )}
                              </label>
                              <input
                                type="url"
                                value={workerAfterPhoto}
                                onChange={(e) => setWorkerAfterPhoto(e.target.value)}
                                placeholder="https://example.com/repaired-work.jpg"
                                className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />

                              {/* Sample Presets to quickly test */}
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-slate-500">Quick Test:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkerAfterPhoto(
                                      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
                                    )
                                  }
                                  className="text-emerald-700 underline hover:text-emerald-900"
                                >
                                  [Repaired Road]
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWorkerAfterPhoto(
                                      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
                                    )
                                  }
                                  className="text-emerald-700 underline hover:text-emerald-900"
                                >
                                  [Repaired Light]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWorkerAfterPhoto("")}
                                  className="text-red-600 underline hover:text-red-800 ml-auto"
                                >
                                  Clear
                                </button>
                              </div>

                              {workerAfterPhoto.trim() ? (
                                <div className="mt-1.5 relative rounded overflow-hidden border border-emerald-400 bg-black max-h-36 flex items-center justify-center">
                                  <img
                                    src={workerAfterPhoto}
                                    alt="After Repair Proof"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src =
                                        "https://placehold.co/600x400?text=Invalid+Image+URL";
                                    }}
                                  />
                                  <span className="absolute bottom-1 right-1 bg-emerald-800 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                                    ✓ After-Repair Proof Preview
                                  </span>
                                </div>
                              ) : (
                                <div className="p-2 border border-dashed border-red-300 bg-red-50/50 rounded text-center text-[10px] text-red-600">
                                  Photo URL khali hai. Kripya proof photo URL enter karein.
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                <span>Resolution Notes & Materials Used: <span className="text-red-500">*</span></span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    workerAfterNotes.trim().length >= 10
                                      ? "text-emerald-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {workerAfterNotes.trim().length}/10 chars min
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={workerAfterNotes}
                                onChange={(e) => setWorkerAfterNotes(e.target.value)}
                                placeholder="Detail the repairs made, materials used, compaction done, etc."
                                className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>

                            {(!workerAfterPhoto.trim() || workerAfterNotes.trim().length < 10) && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 font-medium flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                <span>
                                  {!workerAfterPhoto.trim()
                                    ? "Photo proof missing! "
                                    : ""}
                                  {workerAfterNotes.trim().length < 10
                                    ? "Resolution notes must be at least 10 characters."
                                    : ""}
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleWorkerCompleteWork}
                              disabled={
                                !workerAfterPhoto.trim() || workerAfterNotes.trim().length < 10
                              }
                              className={`w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                workerAfterPhoto.trim() && workerAfterNotes.trim().length >= 10
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-sm"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" /> 2. Submit Completed Work With Photographic Evidence
                            </button>
                          </div>
                        )}

                        {/* Visual Evidence Summary for RESOLVED or CLOSED */}
                        {(selectedIncident.status === "RESOLVED" ||
                          selectedIncident.status === "CLOSED") && (
                          <div className="space-y-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3.5">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Photographic Evidence Recorded
                              </span>
                              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                                {selectedIncident.status}
                              </span>
                            </div>

                            {/* Before vs After Visual Comparison */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="border border-slate-200 bg-white rounded p-1.5">
                                <span className="font-bold text-slate-700 block mb-1">
                                  Before Repair:
                                </span>
                                {selectedIncident.media?.find(
                                  (m) => m.phase === "before" || m.phase === "initial",
                                )?.url ? (
                                  <img
                                    src={
                                      selectedIncident.media.find(
                                        (m) => m.phase === "before" || m.phase === "initial",
                                      )!.url
                                    }
                                    alt="Before"
                                    className="w-full h-20 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-20 bg-slate-100 flex items-center justify-center text-slate-400">
                                    Initial Photo
                                  </div>
                                )}
                              </div>

                              <div className="border border-emerald-300 bg-white rounded p-1.5">
                                <span className="font-bold text-emerald-800 block mb-1">
                                  After Repair (Evidence):
                                </span>
                                {selectedIncident.media?.find((m) => m.phase === "after")?.url ? (
                                  <img
                                    src={
                                      selectedIncident.media.find((m) => m.phase === "after")!.url
                                    }
                                    alt="After"
                                    className="w-full h-20 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-20 bg-emerald-50 flex items-center justify-center text-emerald-600 font-medium">
                                    ✓ Completed
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedIncident.resolution?.resolutionNotes && (
                              <div className="text-[11px] bg-white p-2 rounded border border-emerald-200 text-slate-700">
                                <strong className="text-emerald-900 block text-[10px]">
                                  Resolution Notes:
                                </strong>
                                {selectedIncident.resolution.resolutionNotes}
                              </div>
                            )}

                            <div className="text-[11px] text-emerald-800 font-medium text-center">
                              {selectedIncident.status === "RESOLVED"
                                ? "✓ Kaam submit ho gaya hai! Nagrik ki approval ka intezar hai."
                                : "✓ Citizen ne verify karke ticket permanently CLOSED kar diya hai."}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Task select karein.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 4: CITY ADMIN PORTAL (COMMISSIONER DASHBOARD)                      */}
        {/* ========================================================================= */}
        {currentRole === "CITY_ADMIN" && (
          <div className="space-y-6">
            {/* Admin Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-purple-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-700" /> Municipal Commissioner & City
                  Admin Headquarters
                </h1>
                <p className="text-xs text-purple-800">
                  Shehar ke sabhi wards, departments (PWD, Sanitation, Water, Electrical), aur
                  spatial hotspots ka bird's-eye view.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-700 text-white text-xs font-bold rounded-md">
                Admin: Municipal Commissioner
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Total Incidents
                </span>
                <p className="text-2xl font-bold text-slate-900">
                  {analyticsOverview?.totalIncidents ?? incidentsList.length}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-amber-600">
                  <Clock className="w-3.5 h-3.5" /> In Progress / Open
                </span>
                <p className="text-2xl font-bold text-amber-600">
                  {
                    incidentsList.filter((i) => i.status !== "CLOSED" && i.status !== "RESOLVED")
                      .length
                  }
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Successfully Resolved
                </span>
                <p className="text-2xl font-bold text-emerald-600">
                  {
                    incidentsList.filter((i) => i.status === "CLOSED" || i.status === "RESOLVED")
                      .length
                  }
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Safety Hazards
                </span>
                <p className="text-2xl font-bold text-red-600">
                  {incidentsList.filter((i) => i.priority === "CRITICAL").length}
                </p>
              </div>
            </div>

            {/* Charts using Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Department Workload Distribution (MongoDB)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "PWD (Roads)", count: 2, fill: "#2563eb" },
                        { name: "Electrical", count: 1, fill: "#f59e0b" },
                        { name: "Water Board", count: 1, fill: "#06b6d4" },
                        { name: "Sanitation", count: 1, fill: "#10b981" },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]}>
                        <Cell fill="#2563eb" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#06b6d4" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  GIS 2dsphere Active Spatial Hotspots
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                    <div>
                      <strong className="text-red-900 block font-mono">
                        Ward 101 [77.601, 12.975]
                      </strong>
                      <span className="text-red-700 text-[11px]">
                        80ft Road Junction - Repeated Pothole Cavities
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-[10px]">
                      High Density
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-center justify-between">
                    <div>
                      <strong className="text-amber-900 block font-mono">
                        Ward 102 [77.641, 12.978]
                      </strong>
                      <span className="text-amber-700 text-[11px]">
                        Indiranagar 12th Main - Streetlight Outages
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-600 text-white rounded font-bold text-[10px]">
                      Moderate
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          CityOS — Intelligent Urban Problem Solving Platform • Multi-Role Civic Portal Architecture
        </div>
      </footer>
    </div>
  );
}
