"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Upload, X, CheckCircle, Twitter } from "lucide-react";
import { getTwitterAuth } from "@/lib/mirror/auth";

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

export default function BugBountyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [category, setCategory] = useState("functionality");
  const [urlWhereFound, setUrlWhereFound] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  
  const twitterAuth = getTwitterAuth();

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(!!twitterAuth?.twitterHandle);
  }, [twitterAuth]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    selectedFiles.forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} is not an allowed type. Please use images or PDFs.`);
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      
      // Create preview for images
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => [...prev, {
          file,
          preview: reader.result as string,
          id: Math.random().toString(36).substring(7)
        }]);
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just add without preview
        setFiles(prev => [...prev, {
          file,
          preview: '',
          id: Math.random().toString(36).substring(7)
        }]);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      // Get browser info
      const browserInfo = `${navigator.userAgent} | ${window.screen.width}x${window.screen.height}`;
      
      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('severity', severity);
      formData.append('category', category);
      formData.append('browserInfo', browserInfo);
      formData.append('urlWhereFound', urlWhereFound);
      formData.append('stepsToReproduce', stepsToReproduce);
      formData.append('expectedBehavior', expectedBehavior);
      formData.append('actualBehavior', actualBehavior);
      
      // Add files
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/bug-bounty/submit', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bug report');
      }
      
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting bug report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/5 backdrop-blur border-white/10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Bug Report Submitted!</h2>
          <p className="text-gray-300">
            Thank you for helping us improve Eva. We'll review your report and get back to you soon.
          </p>
          <p className="text-gray-400 mt-4 text-sm">
            Redirecting you to the home page...
          </p>
        </Card>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-white/5 backdrop-blur border-white/10 text-center">
          <Twitter className="w-16 h-16 text-white/60 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-300 mb-6">
            To submit bug reports and earn rewards, please sign in with your Twitter account.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Authenticated users earn points for verified bug reports:
            <br />
            • Critical: 1000 points + $500
            <br />
            • High: 500 points + $250
            <br />
            • Medium: 250 points + $100
            <br />
            • Low: 100 points + $50
          </p>
          <Button
            onClick={() => window.location.href = '/api/auth/twitter'}
            className="bg-white text-black hover:bg-gray-100"
          >
            <Twitter className="w-4 h-4 mr-2" />
            Sign in with Twitter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative px-4 py-16 mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Bug Bounty Program
        </h1>
        <p className="text-xl text-gray-300 text-center mb-8 max-w-2xl mx-auto">
          Help us improve Eva by reporting bugs. Earn points and rewards for critical findings.
        </p>
        
        {/* Rewards Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <h3 className="text-red-400 font-semibold mb-1">Critical</h3>
            <p className="text-white text-2xl font-bold">$500+</p>
            <p className="text-gray-300 text-sm">+1000 points</p>
          </Card>
          <Card className="p-4 bg-orange-500/10 border-orange-500/20">
            <h3 className="text-orange-400 font-semibold mb-1">High</h3>
            <p className="text-white text-2xl font-bold">$250+</p>
            <p className="text-gray-300 text-sm">+500 points</p>
          </Card>
          <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
            <h3 className="text-yellow-400 font-semibold mb-1">Medium</h3>
            <p className="text-white text-2xl font-bold">$100+</p>
            <p className="text-gray-300 text-sm">+250 points</p>
          </Card>
          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <h3 className="text-blue-400 font-semibold mb-1">Low</h3>
            <p className="text-white text-2xl font-bold">$50+</p>
            <p className="text-gray-300 text-sm">+100 points</p>
          </Card>
        </div>

        {/* Submission Form */}
        <Card className="p-8 bg-white/5 backdrop-blur border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info */}
            {twitterAuth?.twitterHandle && (
              <div className="text-sm text-gray-400 mb-4">
                Submitting as: @{twitterAuth.twitterHandle}
              </div>
            )}
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">
                  Bug Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the bug"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity" className="text-white">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="functionality">Functionality</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>



            {/* Technical Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="url" className="text-white">URL Where Bug Was Found</Label>
                <Input
                  id="url"
                  type="text"
                  value={urlWhereFound}
                  onChange={(e) => setUrlWhereFound(e.target.value)}
                  placeholder="https://evaonline.xyz/..."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              
              <div>
                <Label htmlFor="steps" className="text-white">Steps to Reproduce</Label>
                <Textarea
                  id="steps"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Go to...\n2. Click on...\n3. See error..."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="expected" className="text-white">Expected Behavior</Label>
                <Textarea
                  id="expected"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should happen?"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              
              <div>
                <Label htmlFor="actual" className="text-white">Actual Behavior</Label>
                <Textarea
                  id="actual"
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happens?"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-white">Attachments (Screenshots, Videos)</Label>
              <div className="mt-1">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white/5 border-2 border-white/10 border-dashed rounded-lg appearance-none cursor-pointer hover:border-white/20 focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      Drop files here or click to upload
                    </span>
                    <span className="text-xs text-gray-500">
                      Images and PDFs up to 5MB
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              
              {/* File Previews */}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map(({ id, file, preview }) => (
                    <div key={id} className="relative group">
                      {preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-24 bg-white/5 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-400 text-center px-2">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !title || !description}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
            </Button>
          </form>
        </Card>

        {/* Guidelines */}
        <Card className="mt-8 p-6 bg-white/5 backdrop-blur border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Guidelines</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Security vulnerabilities have the highest priority and rewards</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Provide clear steps to reproduce the issue</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Include screenshots or videos when possible</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Check if the bug has already been reported</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Test in multiple browsers if relevant</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
