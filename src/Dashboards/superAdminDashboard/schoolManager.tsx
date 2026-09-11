import React, { useState } from "react";
import { Building2, Search, ShieldAlert, Eye, Mail, Phone, User, X, Plus, CheckCircle2, Globe, Edit3, Image as ImageIcon, ToggleLeft, ToggleRight, CreditCard, Calendar } from 'lucide-react';
import axios from 'axios';
import { 
  useGetAllSchoolsQuery, 
  useGetSchoolByIdQuery, 
  useGetSchoolBySlugQuery, 
  useCreateSchoolMutation, 
  useUpdateSchoolMutation, 
  useToggleSchoolStatusMutation,
  useUpdateSchoolSubscriptionMutation,
  type School 
} from '../../features/Apis/School.Api';

export default function ManageSchools() {
  const { data: schoolsData, isLoading, error: fetchError } = useGetAllSchoolsQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedSchoolSlug, setSelectedSchoolSlug] = useState<string | null>(null);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [subscriptionModalSchool, setSubscriptionModalSchool] = useState<School | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Cloudinary upload states for editing school images
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const cloud_name = 'dwibg4vvf';
  const preset_key = 'tickets';

  const [createSchool, { isLoading: isCreating }] = useCreateSchoolMutation();
  const [updateSchool, { isLoading: isUpdating }] = useUpdateSchoolMutation();
  const [toggleSchoolStatus, { isLoading: isTogglingStatus }] = useToggleSchoolStatusMutation();
  const [updateSchoolSubscription, { isLoading: isUpdatingSubscription }] = useUpdateSchoolSubscriptionMutation();

  const { data: schoolDetail, isLoading: isLoadingDetail } = useGetSchoolByIdQuery(
    selectedSchoolId ?? '', 
    { skip: !selectedSchoolId }
  );

  const { data: schoolSlugDetail, isLoading: isLoadingSlugDetail } = useGetSchoolBySlugQuery(
    selectedSchoolSlug ?? '',
    { skip: !selectedSchoolSlug }
  );

  const initialFormState = {
    name: "",
    shortName: "",
    slug: "",
    motto: "",
    registrationNumber: "",
    knecCode: "",
    schoolType: "Secondary",
    curriculumType: "CBC",
    establishedYear: new Date().getFullYear(),
    primaryColor: "#0F172A",
    secondaryColor: "#64748B",
    address: "",
    county: "",
    subCounty: "",
    phone: "",
    email: "",
    website: "",
    timezone: "Africa/Nairobi",
    currency: "KES",
    principalName: "",
    subscriptionPlan: "Standard",
    subscriptionStatus: "Active",
    logoUrl: "",
    faviconUrl: "",
    coverImageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    subscriptionPlan: "Trial",
    subscriptionStatus: "Active",
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const schools = schoolsData?.schools || [];

  console.log("[ManageSchools] render", {
    schoolsCount: schools.length,
    isLoading,
    fetchError,
    searchTerm,
    selectedSchoolId,
    selectedSchoolSlug,
    editingSchoolId,
    subscriptionModalSchool,
    isCreateModalOpen,
  });

  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.curriculumType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.registrationNumber && school.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (school.knecCode && school.knecCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (field: string, value: any) => {
    console.log("[handleInputChange]", { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: any) => {
    console.log("[handleEditInputChange]", { field, value });
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadToCloudinary = async (file: File, resourceType: string = 'image'): Promise<string> => {
    console.log("[uploadToCloudinary] start", { fileName: file?.name, fileSize: file?.size, resourceType });
    const cloudFormData = new FormData();
    cloudFormData.append('file', file);
    cloudFormData.append('upload_preset', preset_key);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`,
      cloudFormData,
      {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log("[uploadToCloudinary] progress", percent);
          setUploadProgress(percent);
        },
      }
    );
    console.log("[uploadToCloudinary] success", { url: response.data.secure_url });
    return response.data.secure_url;
  };

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[handleCreateSchoolSubmit] submitted", formData);
    setActionError(null);

    const payload = {
      ...formData,
      establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
    };

    try {
      const response: any = await createSchool(payload as Partial<School>).unwrap();
      console.log("[handleCreateSchoolSubmit] success", response);
      const createdName = response?.school?.name || formData.name || "Institution";
      setLastActionMessage(`${createdName} record has been successfully created.`);
      
      setIsCreateModalOpen(false);
      setFormData(initialFormState);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.log("[handleCreateSchoolSubmit] error", err);
      console.error("Failed to create school:", err);
      setActionError(err?.data?.message || err?.message || "Failed to provision new institution.");
    }
  };

  const handleUpdateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[handleUpdateSchoolSubmit] submitted", { editingSchoolId, editFormData, logoFile, faviconFile, coverFile });
    if (!editingSchoolId) return;
    setActionError(null);
    setIsUploadingImage(true);

    try {
      let updatedLogoUrl = editFormData.logoUrl;
      let updatedFaviconUrl = editFormData.faviconUrl;
      let updatedCoverUrl = editFormData.coverImageUrl;

      if (logoFile) {
        console.log("[handleUpdateSchoolSubmit] uploading logo");
        updatedLogoUrl = await uploadToCloudinary(logoFile);
      }
      if (faviconFile) {
        console.log("[handleUpdateSchoolSubmit] uploading favicon");
        updatedFaviconUrl = await uploadToCloudinary(faviconFile);
      }
      if (coverFile) {
        console.log("[handleUpdateSchoolSubmit] uploading cover image");
        updatedCoverUrl = await uploadToCloudinary(coverFile);
      }

      const patch = {
        name: editFormData.name,
        shortName: editFormData.shortName,
        motto: editFormData.motto,
        registrationNumber: editFormData.registrationNumber,
        knecCode: editFormData.knecCode,
        schoolType: editFormData.schoolType,
        curriculumType: editFormData.curriculumType,
        establishedYear: editFormData.establishedYear ? Number(editFormData.establishedYear) : undefined,
        primaryColor: editFormData.primaryColor,
        secondaryColor: editFormData.secondaryColor,
        address: editFormData.address,
        county: editFormData.county,
        subCounty: editFormData.subCounty,
        phone: editFormData.phone,
        email: editFormData.email,
        website: editFormData.website,
        timezone: editFormData.timezone,
        currency: editFormData.currency,
        principalName: editFormData.principalName,
        subscriptionPlan: editFormData.subscriptionPlan,
        subscriptionStatus: editFormData.subscriptionStatus,
        logoUrl: updatedLogoUrl,
        faviconUrl: updatedFaviconUrl,
        coverImageUrl: updatedCoverUrl,
      };

      console.log("[handleUpdateSchoolSubmit] patch payload", patch);
      await updateSchool({ schoolId: editingSchoolId, patch }).unwrap();
      console.log("[handleUpdateSchoolSubmit] success");
      setEditingSchoolId(null);
      setLogoFile(null);
      setFaviconFile(null);
      setCoverFile(null);
      setUploadProgress(0);
      setLastActionMessage(`${editFormData.name || "Institution"} details successfully updated.`);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.log("[handleUpdateSchoolSubmit] error", err);
      console.error("Failed to update school:", err);
      setActionError(err?.data?.message || err?.message || "Failed to update institution details.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleStatus = async (school: School) => {
    console.log("[handleToggleStatus] clicked", { schoolId: school.id, currentStatus: school.isActive });
    setActionError(null);
    try {
      const newStatus = !school.isActive;
      await toggleSchoolStatus({ schoolId: school.id, isActive: newStatus }).unwrap();
      console.log("[handleToggleStatus] success", { schoolId: school.id, newStatus });
      setLastActionMessage(`${school.name} status toggled to ${newStatus ? "Active" : "Inactive"}.`);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.log("[handleToggleStatus] error", err);
      console.error("Failed to toggle school status:", err);
      setActionError(err?.data?.message || err?.message || "Failed to toggle school status.");
    }
  };

  const handleUpdateSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[handleUpdateSubscriptionSubmit] submitted", { subscriptionModalSchool, subscriptionFormData });
    if (!subscriptionModalSchool) return;
    setActionError(null);

    try {
      const subscriptionPayload = {
        subscriptionPlan: subscriptionFormData.subscriptionPlan,
        subscriptionStatus: subscriptionFormData.subscriptionStatus,
        subscriptionExpiresAt: new Date(subscriptionFormData.subscriptionExpiresAt).toISOString(),
      };

      console.log("[handleUpdateSubscriptionSubmit] payload", subscriptionPayload);
      await updateSchoolSubscription({ 
        schoolId: subscriptionModalSchool.id, 
        subscription: subscriptionPayload 
      }).unwrap();

      console.log("[handleUpdateSubscriptionSubmit] success");
      setSubscriptionModalSchool(null);
      setLastActionMessage(`${subscriptionModalSchool.name} subscription updated successfully.`);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.log("[handleUpdateSubscriptionSubmit] error", err);
      console.error("Failed to update subscription:", err);
      setActionError(err?.data?.message || err?.message || "Failed to update school subscription.");
    }
  };

  const openEditModal = (school: School) => {
    console.log("[openEditModal] opening for school", school.id);
    setEditingSchoolId(school.id);
    setLogoFile(null);
    setFaviconFile(null);
    setCoverFile(null);
    setUploadProgress(0);
    setEditFormData({
      name: school.name || "",
      shortName: school.shortName || "",
      slug: school.slug || "",
      motto: school.motto || "",
      registrationNumber: school.registrationNumber || "",
      knecCode: school.knecCode || "",
      schoolType: school.schoolType || "Secondary",
      curriculumType: school.curriculumType || "CBC",
      establishedYear: school.establishedYear || new Date().getFullYear(),
      primaryColor: school.primaryColor || "#0F172A",
      secondaryColor: school.secondaryColor || "#64748B",
      address: school.address || "",
      county: school.county || "",
      subCounty: school.subCounty || "",
      phone: school.phone || "",
      email: school.email || "",
      website: school.website || "",
      timezone: school.timezone || "Africa/Nairobi",
      currency: school.currency || "KES",
      principalName: school.principalName || "",
      subscriptionPlan: school.subscriptionPlan || "Standard",
      subscriptionStatus: school.subscriptionStatus || "Active",
      logoUrl: (school as any).logoUrl || "",
      faviconUrl: (school as any).faviconUrl || "",
      coverImageUrl: (school as any).coverImageUrl || "",
    });
  };

  const openSubscriptionModal = (school: School) => {
    console.log("[openSubscriptionModal] opening for school", school.id);
    setSubscriptionModalSchool(school);
    setSubscriptionFormData({
      subscriptionPlan: school.subscriptionPlan || "Standard",
      subscriptionStatus: school.subscriptionStatus || "Active",
      subscriptionExpiresAt: school.subscriptionExpiresAt 
        ? new Date(school.subscriptionExpiresAt).toISOString().slice(0, 16) 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
  };

  if (isLoading) {
    console.log("[ManageSchools] rendering loading state");
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent border-b-secondary border-l-transparent animate-spin"></div>
            <div className="absolute inset-6 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-base-content animate-pulse">
              Loading School Directory...
            </h3>
            <p className="text-xs text-base-content/60 font-medium">
              Synchronizing RTK Query cache &amp; tenant records
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    console.log("[ManageSchools] rendering error state", fetchError);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center p-4 sm:p-6 animate-fadeIn">
        <div className="card bg-base-100 p-6 sm:p-8 shadow-xl max-w-md w-full border border-base-300 animate-slideUp space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-error">Failed to Load Directory</h2>
          <p className="text-sm sm:text-base text-base-content/75">
            Unable to fetch school listings using RTK Query endpoint. Please verify backend service connectivity.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary w-full transition-all duration-300 hover:scale-[1.02]">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // School detail modal render helper function
  const renderSchoolDetailModal = () => {
    console.log("[renderSchoolDetailModal] called", { selectedSchoolId, isLoadingDetail, hasDetail: !!schoolDetail });
    if (!selectedSchoolId) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn">
        <div className="modal-box max-w-lg bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 space-y-6 animate-slideUp">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Institution Details</h3>
                <p className="text-xs text-base-content/70">Detailed profile fetched via RTK Query.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log("[renderSchoolDetailModal] close clicked");
                setSelectedSchoolId(null);
              }} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={16} />
            </button>
          </div>

          {isLoadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/60 font-medium">Fetching institution record...</p>
            </div>
          ) : schoolDetail ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                  <h4 className="font-extrabold text-base text-base-content">{schoolDetail.name}</h4>
                  <span className="font-mono text-xs text-base-content/60">{schoolDetail.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const slugToFetch = schoolDetail.slug;
                      console.log("[renderSchoolDetailModal] Test Slug API clicked", slugToFetch);
                      setSelectedSchoolId(null);
                      setSelectedSchoolSlug(slugToFetch);
                    }}
                    className="btn btn-xs btn-outline btn-primary gap-1 font-semibold"
                    title="Test getSchoolBySlug endpoint"
                  >
                    <Globe size={12} /> Test Slug API
                  </button>
                  <span className={`badge badge-sm font-semibold border-none px-3 py-2 ${schoolDetail.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                    {schoolDetail.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">School Type</span>
                  <span className="font-semibold text-base-content/80 text-xs sm:text-sm">{schoolDetail.schoolType}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">Curriculum</span>
                  <span className="badge badge-xs badge-outline font-semibold mt-1">{schoolDetail.curriculumType}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">Registration No.</span>
                  <span className="font-mono text-xs font-semibold text-base-content/80">{schoolDetail.registrationNumber || "N/A"}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">KNEC Code</span>
                  <span className="font-mono text-xs font-semibold text-base-content/80">{schoolDetail.knecCode || "N/A"}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50 col-span-2">
                  <span className="text-xs text-base-content/50 block font-medium">Subscription Plan</span>
                  <span className="font-semibold uppercase text-base-content/80 text-xs tracking-wider">{schoolDetail.subscriptionPlan}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-base-300">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <Mail size={16} className="text-primary shrink-0" />
                  <span className="truncate">{schoolDetail.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <Phone size={16} className="text-primary shrink-0" />
                  <span>{schoolDetail.phone || "No phone contact provided"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <User size={16} className="text-primary shrink-0" />
                  <span>Principal: {schoolDetail.principalName || "Not assigned"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-error text-sm">
              Failed to load details for this institution.
            </div>
          )}

          <div className="modal-action pt-4 border-t border-base-300">
            <button 
              onClick={() => {
                console.log("[renderSchoolDetailModal] Close button clicked");
                setSelectedSchoolId(null);
              }} 
              className="btn btn-primary btn-sm sm:btn-md w-full font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // School slug resolution modal render helper function
  const renderSchoolSlugModal = () => {
    console.log("[renderSchoolSlugModal] called", { selectedSchoolSlug, isLoadingSlugDetail, hasDetail: !!schoolSlugDetail });
    if (!selectedSchoolSlug) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn">
        <div className="modal-box max-w-lg bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 space-y-6 animate-slideUp">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Portal Resolution (Slug)</h3>
                <p className="text-xs text-base-content/70">GET /schools/slug/{selectedSchoolSlug}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log("[renderSchoolSlugModal] close clicked");
                setSelectedSchoolSlug(null);
              }} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={16} />
            </button>
          </div>

          {isLoadingSlugDetail ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <span className="loading loading-spinner loading-md text-secondary"></span>
              <p className="text-xs text-base-content/60 font-medium">Resolving school by slug endpoint...</p>
            </div>
          ) : schoolSlugDetail ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                  <h4 className="font-extrabold text-base text-base-content">{schoolSlugDetail.name}</h4>
                  <span className="font-mono text-xs text-primary font-semibold">{schoolSlugDetail.slug}</span>
                </div>
                <span className={`badge badge-sm font-semibold border-none px-3 py-2 ${schoolSlugDetail.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                  {schoolSlugDetail.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">School Type</span>
                  <span className="font-semibold text-base-content/80 text-xs sm:text-sm">{schoolSlugDetail.schoolType}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">Curriculum</span>
                  <span className="badge badge-xs badge-outline font-semibold mt-1">{schoolSlugDetail.curriculumType}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">Registration No.</span>
                  <span className="font-mono text-xs font-semibold text-base-content/80">{schoolSlugDetail.registrationNumber || "N/A"}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50">
                  <span className="text-xs text-base-content/50 block font-medium">KNEC Code</span>
                  <span className="font-mono text-xs font-semibold text-base-content/80">{schoolSlugDetail.knecCode || "N/A"}</span>
                </div>
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-300/50 col-span-2">
                  <span className="text-xs text-base-content/50 block font-medium">Subscription Plan</span>
                  <span className="font-semibold uppercase text-base-content/80 text-xs tracking-wider">{schoolSlugDetail.subscriptionPlan}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-base-300">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <Mail size={16} className="text-secondary shrink-0" />
                  <span className="truncate">{schoolSlugDetail.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <Phone size={16} className="text-secondary shrink-0" />
                  <span>{schoolSlugDetail.phone || "No phone contact provided"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-base-content/80">
                  <User size={16} className="text-secondary shrink-0" />
                  <span>Principal: {schoolSlugDetail.principalName || "Not assigned"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-error text-sm">
              Failed to resolve school by slug. Please verify endpoint configuration.
            </div>
          )}

          <div className="modal-action pt-4 border-t border-base-300">
            <button 
              onClick={() => {
                console.log("[renderSchoolSlugModal] Close button clicked");
                setSelectedSchoolSlug(null);
              }} 
              className="btn btn-secondary btn-sm sm:btn-md w-full font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success confirmation modal render helper function
  const renderSuccessModal = () => {
    console.log("[renderSuccessModal] called", { isSuccessModalOpen, lastActionMessage });
    if (!isSuccessModalOpen) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn">
        <div className="modal-box max-w-sm bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 text-center space-y-6 animate-slideUp">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-base-content">Operation Successful!</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              {lastActionMessage || "Action completed successfully."}
            </p>
          </div>

          <div className="modal-action pt-2 justify-center">
            <button 
              onClick={() => {
                console.log("[renderSuccessModal] Done button clicked");
                setIsSuccessModalOpen(false);
              }} 
              className="btn btn-primary btn-sm sm:btn-md w-full font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create school modal render helper function
  const renderCreateSchoolModal = () => {
    console.log("[renderCreateSchoolModal] called", { isCreateModalOpen });
    if (!isCreateModalOpen) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn overflow-y-auto">
        <div className="modal-box max-w-2xl bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 space-y-6 my-8">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Onboard New Institution</h3>
                <p className="text-xs text-base-content/70">Register a new school tenant.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log("[renderCreateSchoolModal] close clicked");
                setIsCreateModalOpen(false);
              }} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={16} />
            </button>
          </div>

          {actionError && (
            <div className="alert alert-error text-xs p-3">
              <ShieldAlert size={16} />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSchoolSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">School Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Hillcrest International" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">URL Slug *</label>
                <input 
                  type="text" 
                  required
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="e.g. hillcrest-international" 
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Short Name</label>
                <input 
                  type="text" 
                  value={formData.shortName}
                  onChange={(e) => handleInputChange("shortName", e.target.value)}
                  placeholder="e.g. HIS" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Motto</label>
                <input 
                  type="text" 
                  value={formData.motto}
                  onChange={(e) => handleInputChange("motto", e.target.value)}
                  placeholder="e.g. Excellence and Integrity" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Registration Number</label>
                <input 
                  type="text" 
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  placeholder="e.g. MOE/INT/1967/992" 
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">KNEC Code</label>
                <input 
                  type="text" 
                  value={formData.knecCode}
                  onChange={(e) => handleInputChange("knecCode", e.target.value)}
                  placeholder="e.g. INT9921" 
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Established Year</label>
                <input 
                  type="number" 
                  value={formData.establishedYear}
                  onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                  placeholder="e.g. 1998" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Subscription Status</label>
                <select 
                  value={formData.subscriptionStatus}
                  onChange={(e) => handleInputChange("subscriptionStatus", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">School Type *</label>
                <select 
                  value={formData.schoolType}
                  onChange={(e) => handleInputChange("schoolType", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="HighSchool">HighSchool</option>
                  <option value="Mixed">Mixed</option>
                  <option value="ECD">ECD</option>
                  <option value="Tertiary">Tertiary</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Curriculum *</label>
                <select 
                  value={formData.curriculumType}
                  onChange={(e) => handleInputChange("curriculumType", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                  <option value="IGCSE">IGCSE</option>
                  <option value="British">British</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Subscription Plan *</label>
                <select 
                  value={formData.subscriptionPlan}
                  onChange={(e) => handleInputChange("subscriptionPlan", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Trial">Trial</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Principal Name</label>
                <input 
                  type="text" 
                  value={formData.principalName}
                  onChange={(e) => handleInputChange("principalName", e.target.value)}
                  placeholder="e.g. Dr. John Doe" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="info@school.edu" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+254 700 000000" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Website URL</label>
                <input 
                  type="url" 
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.school.edu" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider">Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="e.g. P.O. Box 123, Nairobi" 
                className="input input-bordered input-sm bg-base-200/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">County</label>
                <input 
                  type="text" 
                  value={formData.county}
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  placeholder="e.g. Nairobi" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Sub-County</label>
                <input 
                  type="text" 
                  value={formData.subCounty}
                  onChange={(e) => handleInputChange("subCounty", e.target.value)}
                  placeholder="e.g. Westlands" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Timezone</label>
                <input 
                  type="text" 
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  placeholder="e.g. Africa/Nairobi" 
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Currency</label>
                <input 
                  type="text" 
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  placeholder="e.g. KES" 
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Primary Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-base-300 p-1 bg-base-200"
                  />
                  <input 
                    type="text" 
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    placeholder="#0F172A" 
                    className="input input-bordered input-sm bg-base-200/50 flex-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Secondary Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-base-300 p-1 bg-base-200"
                  />
                  <input 
                    type="text" 
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    placeholder="#64748B" 
                    className="input input-bordered input-sm bg-base-200/50 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="modal-action pt-4 border-t border-base-300">
              <button 
                type="button" 
                onClick={() => {
                  console.log("[renderCreateSchoolModal] Cancel button clicked");
                  setIsCreateModalOpen(false);
                }} 
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCreating} 
                className="btn btn-primary btn-sm font-bold"
              >
                {isCreating ? "Provisioning..." : "Create Institution"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit school modal (Super Admin PUT /schools/:id with Cloudinary uploads)
  const renderEditSchoolModal = () => {
    console.log("[renderEditSchoolModal] called", { editingSchoolId });
    if (!editingSchoolId) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn overflow-y-auto">
        <div className="modal-box max-w-2xl bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 space-y-6 my-8">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Update School Details (Super Admin)</h3>
                <p className="text-xs text-base-content/70">PUT /schools/{editingSchoolId}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log("[renderEditSchoolModal] close clicked");
                setEditingSchoolId(null);
              }} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={16} />
            </button>
          </div>

          {actionError && (
            <div className="alert alert-error text-xs p-3">
              <ShieldAlert size={16} />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateSchoolSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">School Name</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  placeholder="e.g. Nyayo Primary School" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Motto</label>
                <input 
                  type="text" 
                  value={editFormData.motto}
                  onChange={(e) => handleEditInputChange("motto", e.target.value)}
                  placeholder="e.g. Excellence and Integrity" 
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Short Name</label>
                <input 
                  type="text" 
                  value={editFormData.shortName}
                  onChange={(e) => handleEditInputChange("shortName", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Principal Name</label>
                <input 
                  type="text" 
                  value={editFormData.principalName}
                  onChange={(e) => handleEditInputChange("principalName", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Registration Number</label>
                <input 
                  type="text" 
                  value={editFormData.registrationNumber}
                  onChange={(e) => handleEditInputChange("registrationNumber", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">KNEC Code</label>
                <input 
                  type="text" 
                  value={editFormData.knecCode}
                  onChange={(e) => handleEditInputChange("knecCode", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">School Type</label>
                <select 
                  value={editFormData.schoolType}
                  onChange={(e) => handleEditInputChange("schoolType", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="HighSchool">HighSchool</option>
                  <option value="Mixed">Mixed</option>
                  <option value="ECD">ECD</option>
                  <option value="Tertiary">Tertiary</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Curriculum</label>
                <select 
                  value={editFormData.curriculumType}
                  onChange={(e) => handleEditInputChange("curriculumType", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                  <option value="IGCSE">IGCSE</option>
                  <option value="British">British</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Established Year</label>
                <input 
                  type="number" 
                  value={editFormData.establishedYear}
                  onChange={(e) => handleEditInputChange("establishedYear", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => handleEditInputChange("email", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Phone</label>
                <input 
                  type="text" 
                  value={editFormData.phone}
                  onChange={(e) => handleEditInputChange("phone", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider">Website URL</label>
              <input 
                type="url" 
                value={editFormData.website}
                onChange={(e) => handleEditInputChange("website", e.target.value)}
                className="input input-bordered input-sm bg-base-200/50"
              />
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider">Address</label>
              <input 
                type="text" 
                value={editFormData.address}
                onChange={(e) => handleEditInputChange("address", e.target.value)}
                className="input input-bordered input-sm bg-base-200/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">County</label>
                <input 
                  type="text" 
                  value={editFormData.county}
                  onChange={(e) => handleEditInputChange("county", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Sub-County</label>
                <input 
                  type="text" 
                  value={editFormData.subCounty}
                  onChange={(e) => handleEditInputChange("subCounty", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Timezone</label>
                <input 
                  type="text" 
                  value={editFormData.timezone}
                  onChange={(e) => handleEditInputChange("timezone", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Currency</label>
                <input 
                  type="text" 
                  value={editFormData.currency}
                  onChange={(e) => handleEditInputChange("currency", e.target.value)}
                  className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Primary Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={editFormData.primaryColor}
                    onChange={(e) => handleEditInputChange("primaryColor", e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-base-300 p-1 bg-base-200"
                  />
                  <input 
                    type="text" 
                    value={editFormData.primaryColor}
                    onChange={(e) => handleEditInputChange("primaryColor", e.target.value)}
                    className="input input-bordered input-sm bg-base-200/50 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Secondary Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={editFormData.secondaryColor}
                    onChange={(e) => handleEditInputChange("secondaryColor", e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-base-300 p-1 bg-base-200"
                  />
                  <input 
                    type="text" 
                    value={editFormData.secondaryColor}
                    onChange={(e) => handleEditInputChange("secondaryColor", e.target.value)}
                    className="input input-bordered input-sm bg-base-200/50 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Subscription Plan</label>
                <select 
                  value={editFormData.subscriptionPlan}
                  onChange={(e) => handleEditInputChange("subscriptionPlan", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Trial">Trial</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Subscription Status</label>
                <select 
                  value={editFormData.subscriptionStatus}
                  onChange={(e) => handleEditInputChange("subscriptionStatus", e.target.value)}
                  className="select select-bordered select-sm bg-base-200/50"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Cloudinary Image File Pickers */}
            <div className="space-y-4 pt-2 border-t border-base-300">
              <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-primary" /> Cloudinary Asset Uploads
              </h4>

              {/* Logo File Input */}
              <div className="form-control bg-base-200/40 p-3 rounded-xl border border-base-300/60">
                <label className="label text-xs font-semibold pb-1">School Logo Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      console.log("[renderEditSchoolModal] logo file selected", file?.name);
                      setLogoFile(file);
                    }}
                    className="file-input file-input-bordered file-input-sm w-full bg-base-100 text-xs"
                  />
                  {editFormData.logoUrl && !logoFile && (
                    <img src={editFormData.logoUrl} alt="Logo preview" className="w-9 h-9 object-cover rounded-lg border border-base-300 shrink-0" />
                  )}
                </div>
                {logoFile && <span className="text-[10px] text-success font-medium mt-1">Selected: {logoFile.name}</span>}
              </div>

              {/* Favicon File Input */}
              <div className="form-control bg-base-200/40 p-3 rounded-xl border border-base-300/60">
                <label className="label text-xs font-semibold pb-1">Favicon Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      console.log("[renderEditSchoolModal] favicon file selected", file?.name);
                      setFaviconFile(file);
                    }}
                    className="file-input file-input-bordered file-input-sm w-full bg-base-100 text-xs"
                  />
                  {editFormData.faviconUrl && !faviconFile && (
                    <img src={editFormData.faviconUrl} alt="Favicon preview" className="w-9 h-9 object-cover rounded-lg border border-base-300 shrink-0" />
                  )}
                </div>
                {faviconFile && <span className="text-[10px] text-success font-medium mt-1">Selected: {faviconFile.name}</span>}
              </div>

              {/* Cover Image File Input */}
              <div className="form-control bg-base-200/40 p-3 rounded-xl border border-base-300/60">
                <label className="label text-xs font-semibold pb-1">Cover Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      console.log("[renderEditSchoolModal] cover file selected", file?.name);
                      setCoverFile(file);
                    }}
                    className="file-input file-input-bordered file-input-sm w-full bg-base-100 text-xs"
                  />
                  {editFormData.coverImageUrl && !coverFile && (
                    <img src={editFormData.coverImageUrl} alt="Cover preview" className="w-12 h-9 object-cover rounded-lg border border-base-300 shrink-0" />
                  )}
                </div>
                {coverFile && <span className="text-[10px] text-success font-medium mt-1">Selected: {coverFile.name}</span>}
              </div>

              {isUploadingImage && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Uploading assets to Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <progress className="progress progress-primary w-full" value={uploadProgress} max="100"></progress>
                </div>
              )}
            </div>

            <div className="modal-action pt-4 border-t border-base-300">
              <button 
                type="button" 
                onClick={() => {
                  console.log("[renderEditSchoolModal] Cancel button clicked");
                  setEditingSchoolId(null);
                }} 
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdating || isUploadingImage} 
                className="btn btn-warning btn-sm font-bold text-warning-content gap-1.5"
              >
                {isUpdating || isUploadingImage ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Update School Subscription Modal (Super Admin PATCH /schools/:id/subscription)
  const renderUpdateSubscriptionModal = () => {
    console.log("[renderUpdateSubscriptionModal] called", { subscriptionModalSchool });
    if (!subscriptionModalSchool) return null;

    return (
      <div className="modal modal-open backdrop-blur-sm bg-black/40 animate-fadeIn">
        <div className="modal-box max-w-md bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-base-300 space-y-6 animate-slideUp">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center font-bold">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Update Subscription</h3>
                <p className="text-xs text-base-content/70">{subscriptionModalSchool.name}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log("[renderUpdateSubscriptionModal] close clicked");
                setSubscriptionModalSchool(null);
              }} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={16} />
            </button>
          </div>

          {actionError && (
            <div className="alert alert-error text-xs p-3">
              <ShieldAlert size={16} />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateSubscriptionSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider">Subscription Plan</label>
              <select 
                value={subscriptionFormData.subscriptionPlan}
                onChange={(e) => {
                  console.log("[renderUpdateSubscriptionModal] plan changed", e.target.value);
                  setSubscriptionFormData(prev => ({ ...prev, subscriptionPlan: e.target.value }));
                }}
                className="select select-bordered select-sm bg-base-200/50"
              >
                <option value="Trial">Trial</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider">Subscription Status</label>
              <select 
                value={subscriptionFormData.subscriptionStatus}
                onChange={(e) => {
                  console.log("[renderUpdateSubscriptionModal] status changed", e.target.value);
                  setSubscriptionFormData(prev => ({ ...prev, subscriptionStatus: e.target.value }));
                }}
                className="select select-bordered select-sm bg-base-200/50"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Expired">Expired</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" /> Expiration Date &amp; Time
              </label>
              <input 
                type="datetime-local" 
                value={subscriptionFormData.subscriptionExpiresAt}
                onChange={(e) => {
                  console.log("[renderUpdateSubscriptionModal] expiry changed", e.target.value);
                  setSubscriptionFormData(prev => ({ ...prev, subscriptionExpiresAt: e.target.value }));
                }}
                className="input input-bordered input-sm bg-base-200/50 font-mono text-xs"
              />
            </div>

            <div className="modal-action pt-4 border-t border-base-300">
              <button 
                type="button" 
                onClick={() => {
                  console.log("[renderUpdateSubscriptionModal] Cancel button clicked");
                  setSubscriptionModalSchool(null);
                }} 
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdatingSubscription} 
                className="btn btn-info btn-sm font-bold text-info-content gap-1.5"
              >
                {isUpdatingSubscription ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span> Updating...
                  </>
                ) : (
                  "Save Subscription"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Card-based listing render helper function
  const renderSchoolCards = () => {
    console.log("[renderSchoolCards] called", { filteredCount: filteredSchools.length, searchTerm });
    return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-base-content/40">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => {
              console.log("[renderSchoolCards] search term changed", e.target.value);
              setSearchTerm(e.target.value);
            }}
            placeholder="Search name, Reg No, KNEC code..." 
            className="input input-bordered input-sm w-full pl-9 bg-base-200/50 focus:bg-base-100 transition-colors"
          />
        </div>
        <div className="text-xs text-base-content/60 font-medium">
          Powered by RTK Query &amp; Automatic Caching
        </div>
      </div>

      {filteredSchools.length === 0 ? (
        <div className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl p-12 text-center text-base-content/50 italic">
          No matching institutions found in the registry.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <div key={school.id} className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {school.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base-content text-base line-clamp-1">{school.name}</h3>
                      <button 
                        onClick={() => {
                          console.log("[renderSchoolCards] slug link clicked", school.slug);
                          setSelectedSchoolSlug(school.slug);
                        }}
                        className="font-mono text-xs text-primary hover:underline text-left block"
                        title="Click to query via GET /schools/slug/:slug"
                      >
                        {school.slug} ↗
                      </button>
                    </div>
                  </div>

                  {/* Toggle Status Button (Super Admin PATCH /schools/:id/status) */}
                  <button
                    onClick={() => handleToggleStatus(school)}
                    disabled={isTogglingStatus}
                    className={`badge badge-sm font-semibold border-none px-3 py-2 cursor-pointer transition-transform hover:scale-105 flex items-center gap-1 ${school.isActive ? "bg-success/20 text-success hover:bg-success/30" : "bg-error/20 text-error hover:bg-error/30"}`}
                    title="Click to toggle active/inactive status"
                  >
                    {school.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {school.isActive ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="divider my-1"></div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-base-content/50 block font-medium">Type</span>
                    <span className="font-semibold text-base-content/80">{school.schoolType}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Curriculum</span>
                    <span className="badge badge-xs badge-outline font-semibold mt-0.5">{school.curriculumType}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Reg No.</span>
                    <span className="font-mono text-xs font-semibold text-base-content/80 truncate block">{school.registrationNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">KNEC Code</span>
                    <span className="font-mono text-xs font-semibold text-base-content/80">{school.knecCode || "N/A"}</span>
                  </div>
                  <div className="col-span-2 mt-1 flex items-center justify-between bg-base-200/40 p-2 rounded-xl border border-base-300/40">
                    <div>
                      <span className="text-base-content/50 block text-[10px] font-medium uppercase">Subscription</span>
                      <span className="font-bold uppercase text-primary tracking-wide text-xs">{school.subscriptionPlan}</span>
                    </div>
                    <button
                      onClick={() => openSubscriptionModal(school)}
                      className="btn btn-xs btn-outline btn-info gap-1 font-semibold"
                      title="Update school subscription"
                    >
                      <CreditCard size={12} /> Plan
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-actions pt-5 mt-4 border-t border-base-200 flex gap-2">
                <button
                  onClick={() => {
                    console.log("[renderSchoolCards] Details clicked", school.id);
                    setSelectedSchoolId(school.id);
                  }}
                  className="btn btn-outline btn-primary btn-sm flex-1 gap-1.5 font-semibold transition-all hover:scale-[1.02]"
                >
                  <Eye size={16} /> Details
                </button>
                <button
                  onClick={() => openEditModal(school)}
                  className="btn btn-outline btn-warning btn-sm gap-1.5 font-semibold transition-all hover:scale-[1.02]"
                  title="Update School Details (Super Admin)"
                >
                  <Edit3 size={16} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content p-4 sm:p-6 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm animate-slideDown">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">School Directory</h1>
              <p className="text-xs sm:text-sm text-base-content/70">Browse multi-tenant school accounts, curriculum parameters, status toggles, and subscriptions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-primary badge-outline font-semibold px-4 py-3 uppercase tracking-wider text-xs">
              Total: {schools.length}
            </div>
            <button
              onClick={() => {
                console.log("[ManageSchools] Onboard School button clicked");
                setIsCreateModalOpen(true);
              }}
              className="btn btn-primary btn-sm gap-2 font-semibold shadow-md transition-all hover:scale-105"
            >
              <Plus size={16} /> Onboard School
            </button>
          </div>
        </div>

        {/* Render Cards Function */}
        {renderSchoolCards()}

        {/* Render Details Modal */}
        {renderSchoolDetailModal()}

        {/* Render Slug Modal */}
        {renderSchoolSlugModal()}

        {/* Render Edit Modal */}
        {renderEditSchoolModal()}

        {/* Render Subscription Modal */}
        {renderUpdateSubscriptionModal()}

        {/* Render Success Confirmation Modal */}
        {renderSuccessModal()}

        {/* Render Create Modal */}
        {renderCreateSchoolModal()}

      </div>
    </div>
  );
}