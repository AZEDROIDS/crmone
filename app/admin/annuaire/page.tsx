import { db } from "@/db"
import { AnnuaireClient } from "@/components/admin/annuaire-client"

export default async function AnnuairePage() {
  const [partenaires, clients] = await Promise.all([
    db.query.partenaires.findMany({ orderBy: (p,{asc})=>[asc(p.nom)] }),
    db.query.clients.findMany({ orderBy: (c,{asc})=>[asc(c.nom)] }),
  ])
  return <AnnuaireClient partenaires={partenaires} clients={clients} />
}
