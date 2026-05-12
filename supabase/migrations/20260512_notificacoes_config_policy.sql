CREATE POLICY "Users can manage own config"
ON notificacoes_config
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
