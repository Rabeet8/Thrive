-- Enable RLS on both tables
alter table public.plants enable row level security;
alter table public.plant_timeline enable row level security;

-- Policies for plants table
create policy "Users can view their own plants"
  on public.plants for select
  using (auth.uid() = user_id);

create policy "Users can create their own plants"
  on public.plants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plants"
  on public.plants for update
  using (auth.uid() = user_id);

create policy "Users can delete their own plants"
  on public.plants for delete
  using (auth.uid() = user_id);

-- Policies for plant_timeline table
create policy "Users can view their own plant timeline"
  on public.plant_timeline for select
  using (auth.uid() = user_id);

create policy "Users can add timeline photos"
  on public.plant_timeline for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their timeline photos"
  on public.plant_timeline for delete
  using (auth.uid() = user_id);

-- Storage policies for images
create policy "Public can view plant images"
  on storage.objects for select
  using (bucket_id in ('plant-images', 'plant-timeline-images'));

create policy "Authenticated users can upload plant images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'plant-images');

create policy "Authenticated users can upload timeline images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'plant-timeline-images');

create policy "Users can delete their own images"
  on storage.objects for delete
  using (auth.uid() = owner);
