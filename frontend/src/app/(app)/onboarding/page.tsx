'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Upload,
  Sparkles,
  Plus,
  X,
  Check,
  RefreshCw,
  Sliders,
  Terminal,
  Database,
  Cpu,
  Layers,
  CloudLightning
} from 'lucide-react';
import { LogoMark } from '@/branding/LogoMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { toast } from 'sonner';
import { resumes, strategic, onboarding as onboardingApi } from '@/lib/intelligence-client';

export default function OnboardingPage() {
  const router = useRouter();
  const { triggerSystemScan } = useLivingSystem();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [hasPreviewData, setHasPreviewData] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);

  const [newSkillInput, setNewSkillInput] = useState('');

  const specializationsList = [
    { id: 'Full Stack', name: 'Full Stack Engineering', desc: 'Hybrid UI/UX layouts & scalable server environments', icon: Layers },
    { id: 'Backend', name: 'Backend Engineering', desc: 'Distributed server design, databases & caching', icon: Database },
    { id: 'Cloud', name: 'Cloud Infrastructure', desc: 'High-availability global networks & load balancing', icon: CloudLightning },
    { id: 'AI', name: 'AI & Large Models', desc: 'GPU cluster orchestration & ML inference pipelines', icon: Cpu },
    { id: 'DevOps', name: 'DevOps & Site Reliability', desc: 'GitOps automated deployments & cluster observability', icon: Terminal },
    { id: 'Frontend', name: 'Frontend Engineering', desc: 'High-fidelity interactions, asset bundling & CSS styling', icon: Sliders }
  ];

  // Step 1: Upload and Parse PDF synchronously without DB write
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }

    setLoading(true);

    try {
      const data = await resumes.preview(file);
      setSkills(data.skills || []);
      setTargetRole(data.target_role || '');
      setSpecialization(data.specialization || '');
      setYearsOfExperience(data.years_of_experience || 0);
      setHasPreviewData(true);
      toast.success('Resume parsed successfully! Review your extracted credentials.');
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error('Could not extract PDF text. Please try a different resume file.');
    } finally {
      setLoading(false);
    }
  };

  // Skills interactive scorecard
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Skill already added.');
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Step 5: Save Strategic Profile & Save Onboarding State
  const handleSaveAndSyncProfile = async () => {
    if (!targetRole.trim() || skills.length === 0) {
      toast.error('Add a target role and at least one skill before continuing.');
      return;
    }
    setLoading(true);

    try {
      await strategic.updateProfile({
        skills,
        target_role: targetRole,
        specialization: specialization || 'General',
        years_of_experience: Number(yearsOfExperience),
      });

      await onboardingApi.saveState({
        is_complete: 'true',
        current_step: 'done',
        target_role: targetRole,
        specialization: specialization || 'General',
        experience_level: yearsOfExperience >= 8 ? 'staff' : yearsOfExperience >= 5 ? 'senior' : 'mid',
      });

      await triggerSystemScan();

      toast.success('Onboarding calibration synced successfully!');
      setStep(6);
      handleFinalize();

    } catch (err) {
      console.error(err);
      toast.error('Sync failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = () => {
    setInitializing(true);
    // Cinematic redirection timer
    setTimeout(() => {
      router.push('/dashboard');
    }, 3800);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#070708] text-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-[#070708] to-[#070708] pointer-events-none" />

        <div className="max-w-md w-full relative z-10 flex flex-col items-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-accent/25 blur-xl rounded-full" />
            <LogoMark size={96} className="text-text relative z-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold mb-8 text-center tracking-tight text-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-spin" />
            Initializing Identity Matrix
          </h2>

          <div className="w-full space-y-4 text-sm text-text-secondary font-mono bg-surface-inset border border-border p-6 rounded-2xl">
            <div className="flex justify-between items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <span>Calibrating specialization graph...</span>
              <span className="text-accent flex items-center gap-1 font-bold text-xs"><Check className="w-3 h-3" /> OK</span>
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
              <span>Synthesizing live job matches...</span>
              <span className="text-accent flex items-center gap-1 font-bold text-xs"><Check className="w-3 h-3" /> OK</span>
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '2.0s', animationFillMode: 'forwards' }}>
              <span>Calibrating roadmap milestones...</span>
              <span className="text-accent flex items-center gap-1 font-bold text-xs"><Check className="w-3 h-3" /> OK</span>
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '2.8s', animationFillMode: 'forwards' }}>
              <span>Hiring confidence engine ready...</span>
              <span className="text-accent flex items-center gap-1 font-bold text-xs"><Check className="w-3 h-3" /> OK</span>
            </div>
          </div>

          <div className="w-full bg-white/5 h-1 mt-10 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-3000 ease-in-out"
              style={{ width: '100%', animation: 'progress 3.5s linear forwards' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full border border-border rounded-3xl p-8 md:p-12 bg-surface/40 backdrop-blur-lg shadow-2xl relative overflow-hidden">

        {/* Header / Brand */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <LogoMark size={32} className="text-accent" />
            <span className="font-bold tracking-tight text-text text-lg">Skillyn OS</span>
          </div>
          <div className="text-xs text-text-tertiary">
            Step {step} of 5
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="flex gap-1.5 mb-10">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                step >= idx ? 'bg-accent shadow-md shadow-accent/25' : 'bg-surface-inset'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: RESUME UPLOAD */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-text">
                Ingest Your Career Record
              </h1>
              <p className="text-text-secondary text-sm">
                Drop your PDF resume below. Our intelligence compiler extracts technology vectors, target roles, and specialization targets in real time.
              </p>
            </div>

            <div className="border border-dashed border-border/80 hover:border-accent/40 rounded-2xl p-10 text-center transition-colors bg-surface-inset relative overflow-hidden group">
              <input
                type="file"
                id="resume-file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />

              {loading ? (
                <div className="space-y-4 py-6">
                  <RefreshCw className="w-12 h-12 text-accent mx-auto animate-spin" />
                  <div>
                    <h4 className="font-semibold text-text">Parsing PDF...</h4>
                    <p className="text-xs text-text-secondary mt-1">Extracting verified competencies from your resume.</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 cursor-pointer" onClick={() => document.getElementById('resume-file')?.click()}>
                  <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-4 group-hover:text-accent transition-colors group-hover:scale-105" />
                  <h3 className="text-lg font-semibold text-text mb-1">
                    Select PDF Resume
                  </h3>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto">
                    Click to browse or drag and drop. Max size 10MB.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={() => setStep(2)}
                variant="ghost"
                className="text-text-secondary hover:text-text"
              >
                Enter skills manually
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SCORECARD INTERACTIVE PREVIEW */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text mb-1">
                Calibrate Extracted Scorecard
              </h1>
              <p className="text-text-secondary text-sm">
                {hasPreviewData
                  ? 'Confirm your extracted parameters. Adjust or add missing tags to calibrate the search crawlers.'
                  : 'Upload a resume to extract skills, or add them manually below.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-inset border border-border p-6 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Target Position</Label>
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-surface border-border text-text mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Years of Experience</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseFloat(e.target.value) || 0)}
                    className="bg-surface border-border text-text mt-1.5"
                  />
                </div>
              </div>

              {/* Skills scorecard */}
              <div className="space-y-3 flex flex-col">
                <Label className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Verified Skill Badges</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add skill tag (e.g. Redis)"
                    className="bg-surface border-border text-text text-sm"
                  />
                  <Button onClick={handleAddSkill} className="bg-surface-raised border border-border text-text hover:bg-surface">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 bg-surface border border-border/80 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                  {skills.length === 0 ? (
                    <p className="text-xs text-text-tertiary py-2">Upload a resume to extract skills, or add them manually.</p>
                  ) : (
                    skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-surface-raised border border-border text-text text-xs px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <span>{skill}</span>
                        <button onClick={() => handleRemoveSkill(skill)} className="text-text-tertiary hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border/50">
              <Button onClick={() => setStep(1)} variant="ghost" className="text-text-secondary hover:text-text">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-accent text-black font-semibold hover:bg-accent-bright"
              >
                Continue Calibration
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TARGET ROLE & SPEC TRACK CHIPS */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text mb-1">
                Refine Search Parameters
              </h1>
              <p className="text-text-secondary text-sm">
                Confirm your primary specialization track. This routes crawler filters and custom dashboard layouts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-inset border border-border p-6 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specSelect" className="text-xs uppercase text-text-tertiary font-bold tracking-wider">
                    Specialization
                  </Label>
                  <Select value={specialization} onValueChange={setSpecialization}>
                    <SelectTrigger id="specSelect" className="bg-surface border-border text-text">
                      <SelectValue placeholder="Select path..." />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-overlay border-border">
                      {specializationsList.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id} className="text-text hover:bg-surface-raised">
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleInput" className="text-xs uppercase text-text-tertiary font-bold tracking-wider">
                    Target Role Title
                  </Label>
                  <Input
                    id="roleInput"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Lead Devops Architect"
                    className="bg-surface border-border text-text"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border/50">
              <Button onClick={() => setStep(2)} variant="ghost" className="text-text-secondary hover:text-text">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-accent text-black font-semibold hover:bg-accent-bright"
              >
                Set Focus Track
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: FOCUS TRACK SELECTOR */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text mb-1">
                Select Domain Focus Track
              </h1>
              <p className="text-text-secondary text-sm">
                Choose the vertical specialization that represents your core technical goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
              {specializationsList.map((item) => {
                const IconComponent = item.icon;
                const isSelected = specialization === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSpecialization(item.id)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative ${
                      isSelected
                        ? 'border-accent bg-accent/5 shadow-md shadow-accent/5'
                        : 'border-border bg-surface-inset hover:border-border-bright hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-accent/15 text-accent' : 'bg-surface text-text-secondary'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-text">{item.name}</h3>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border/50">
              <Button onClick={() => setStep(3)} variant="ghost" className="text-text-secondary hover:text-text">
                Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="bg-accent text-black font-semibold hover:bg-accent-bright"
              >
                Proceed to Synthesis
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: ROADMAP & MATCHES SYNCHRONIZATION */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-2">
                Generate Strategic Roadmap
              </h1>
              <p className="text-text-secondary text-sm">
                Ready to synthesize your career operating system. Skillyn will compile custom learning milestones, recruiter vectors, and live crawls.
              </p>
            </div>

            <div className="bg-surface-inset border border-border p-6 rounded-2xl space-y-4 max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Target Position</span>
                <span className="text-sm font-semibold text-text">{targetRole}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Domain Track</span>
                <span className="text-sm font-semibold text-accent">{specialization} Engineering</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Years Exp</span>
                <span className="text-sm font-semibold text-text">{yearsOfExperience} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase text-text-tertiary font-bold tracking-wider">Verified Badges</span>
                <span className="text-sm font-semibold text-text">{skills.length} skills listed</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-border/50 items-center">
              <Button
                onClick={handleSaveAndSyncProfile}
                disabled={loading}
                className="w-full max-w-md bg-accent text-black font-bold py-6 text-base rounded-2xl hover:bg-accent-bright shadow-lg shadow-accent/15 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Confirm & Generate Strategy
              </Button>
              <Button onClick={() => setStep(4)} variant="ghost" className="text-text-secondary hover:text-text text-xs">
                Go back and modify calibration
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
