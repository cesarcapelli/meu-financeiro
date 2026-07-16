sed -i '735,$d' src/app/components/pages/OrcamentoPage.tsx
cat << 'INNER_EOF' >> src/app/components/pages/OrcamentoPage.tsx
      ) : activeTab === "metas" ? (
        <div className="animate-in fade-in duration-300">
          <MetasPage onContribute={onContributeGoal} onAdd={onAddGoal} onEdit={onEditGoal} />
        </div>
      ) : null}
    </div>
  );
}
INNER_EOF
