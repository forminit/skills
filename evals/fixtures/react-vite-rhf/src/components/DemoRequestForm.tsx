import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  workEmail: z.string().email("Enter a valid work email"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201+"]),
  country: z.string().min(1, "Required"),
  interests: z.array(z.string()).min(1, "Pick at least one"),
  teamSize: z.coerce.number().int().min(1),
  notes: z.string().max(2000).optional(),
  attachments: z.any().optional(),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

type FormValues = z.infer<typeof schema>;

const COUNTRIES = ["United States", "United Kingdom", "Germany", "Turkey", "Brazil"];
const INTERESTS = [
  { id: "inbox", label: "Shared inbox" },
  { id: "chat", label: "Live chat" },
  { id: "ai", label: "AI replies" },
];

export function DemoRequestForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { interests: [], teamSize: 5 } });

  const onSubmit = async (values: FormValues) => {
    // TODO: connect to a backend
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(values);
    toast.success("Thanks! Our team will contact you within one business day.");
    reset();
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-row">
        <label>
          <span className="form-label">First name</span>
          <input className="form-input" {...register("firstName")} />
          {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
        </label>
        <label>
          <span className="form-label">Last name</span>
          <input className="form-input" {...register("lastName")} />
          {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
        </label>
      </div>
      <label>
        <span className="form-label">Work email</span>
        <input className="form-input" type="email" {...register("workEmail")} />
        {errors.workEmail && <p className="form-error">{errors.workEmail.message}</p>}
      </label>
      <div className="form-row">
        <label>
          <span className="form-label">Company size</span>
          <select className="form-input" {...register("companySize")}>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </label>
        <label>
          <span className="form-label">Country</span>
          <select className="form-input" {...register("country")}>
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="form-label">What are you interested in?</legend>
        {INTERESTS.map((i) => (
          <label key={i.id} className="checkbox-row">
            <input type="checkbox" value={i.id} {...register("interests")} /> {i.label}
          </label>
        ))}
        {errors.interests && <p className="form-error">{errors.interests.message}</p>}
      </fieldset>
      <label>
        <span className="form-label">How many agents on your team?</span>
        <input className="form-input" type="number" min={1} {...register("teamSize")} />
      </label>
      <label>
        <span className="form-label">Anything else?</span>
        <textarea className="form-input" rows={4} {...register("notes")} />
      </label>
      <label>
        <span className="form-label">Screenshots of your current setup</span>
        <input className="form-input" type="file" multiple accept="image/*" {...register("attachments")} />
      </label>
      <label className="checkbox-row">
        <input type="checkbox" {...register("agreeToTerms")} /> I agree to the terms of service
      </label>
      {errors.agreeToTerms && <p className="form-error">{errors.agreeToTerms.message}</p>}
      <button className="btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Request demo"}
      </button>
    </form>
  );
}
