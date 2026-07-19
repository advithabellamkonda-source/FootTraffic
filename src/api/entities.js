import { supabase } from '@/lib/supabaseClient';

// Base44's entities used `-created_date` / `field` sort strings and auto-managed
// `created_date`/`updated_date` columns. Our Postgres tables use `created_at`/`updated_at`.
const FIELD_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
};

function createEntity(table) {
  return {
    async list(sort, limit) {
      let query = supabase.from(table).select('*');
      if (sort) {
        const descending = sort.startsWith('-');
        const rawField = descending ? sort.slice(1) : sort;
        const field = FIELD_ALIASES[rawField] || rawField;
        query = query.order(field, { ascending: !descending });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async create(fields) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(table)
        .insert({ ...fields, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, fields) {
      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    async bulkCreate(items) {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = items.map((item) => ({ ...item, user_id: user?.id }));
      const { data, error } = await supabase.from(table).insert(rows).select();
      if (error) throw error;
      return data;
    },

    async bulkUpdate(items) {
      return Promise.all(items.map(({ id, ...fields }) => this.update(id, fields)));
    },
  };
}

export const Customer = createEntity('customers');
export const Post = createEntity('posts');
export const Newsletter = createEntity('newsletters');
export const Review = createEntity('reviews');
export const Promotion = createEntity('promotions');
export const AdCampaign = createEntity('ad_campaigns');
export const Partnership = createEntity('partnerships');
