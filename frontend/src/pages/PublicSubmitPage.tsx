import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, FileEdit, Send, Sparkles } from 'lucide-react';
import { publicApi, PublicSubmitData } from '../api/public';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

const submitSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must provide at least 10 characters').max(10000),
  category_id: z.string().optional(),
  department_id: z.string().optional(),
  reporter_name: z.string().max(255).optional(),
  reporter_email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  reporter_phone: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  is_anonymous: z.boolean(),
});

type FormData = z.infer<typeof submitSchema>;

export const PublicSubmitPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: publicApi.getCategories,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['public', 'departments'],
    queryFn: publicApi.getDepartments,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      is_anonymous: false,
      title: '',
      description: '',
    },
  });

  const isAnonymous = watch('is_anonymous');

  const mutation = useMutation({
    mutationFn: (data: PublicSubmitData) => publicApi.submitFeedback(data),
    onSuccess: (data) => {
      navigate('/submit/success', {
        state: {
          reference_number: data.reference_number,
          tracking_secret: data.tracking_secret,
          title: data.title,
        },
      });
    },
  });

  const onSubmit = (formData: FormData) => {
    mutation.mutate({
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id || undefined,
      department_id: formData.department_id || undefined,
      reporter_name: isAnonymous ? undefined : formData.reporter_name || undefined,
      reporter_email: isAnonymous ? undefined : formData.reporter_email || undefined,
      reporter_phone: isAnonymous ? undefined : formData.reporter_phone || undefined,
      location: formData.location || undefined,
      is_anonymous: formData.is_anonymous,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-3">
          <FileEdit className="w-3.5 h-3.5" />
          Public Submission Portal
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Submit Feedback or Complaint</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          Your feedback will be automatically triaged with Gemini AI and assigned to the relevant department.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {mutation.isError && (
          <Alert type="error" title="Submission Failed" className="mb-6">
            {(mutation.error as any)?.response?.data?.detail || 'An error occurred while submitting feedback.'}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Subject / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g., Billing charge error on invoice #9021"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              {...register('description')}
              placeholder="Please provide full details, dates, expected outcomes, or any error messages..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Gemini AI will automatically analyze this description to identify sentiment, urgency, and category.
            </p>
          </div>

          {/* Optional Category and Department selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category (Optional)
              </label>
              <select
                {...register('category_id')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Let AI Recommend --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department (Optional)
              </label>
              <select
                {...register('department_id')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Let AI Recommend --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Location / Branch (Optional)
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="e.g., North Building Room 204, or Online Website"
              className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Anonymous toggle */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_anonymous')}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Submit Anonymously</span>
                <p className="text-xs text-slate-500">
                  Your identity will not be attached to this complaint. You will receive a secret key to track updates.
                </p>
              </div>
            </label>
          </div>

          {/* Contact Details (Visible if not anonymous) */}
          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  {...register('reporter_name')}
                  placeholder="Jane Citizen"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('reporter_email')}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.reporter_email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.reporter_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  {...register('reporter_phone')}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              size="lg"
              isLoading={mutation.isPending}
              className="w-full sm:w-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
