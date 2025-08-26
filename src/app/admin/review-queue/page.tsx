// src/app/admin/review-queue/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { ReportedContent } from "@/models/ReportedContent";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { AdminLayout } from "@/components/layouts/AdminLayout";

async function getReportedContent() {
  await connectToDatabase();
  
  const reports = await ReportedContent.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'reporterId',
        foreignField: '_id',
        as: 'reporter'
      }
    },
    {
      $unwind: '$reporter'
    },
    {
      $lookup: {
        from: 'updateposts',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'authorId',
              foreignField: '_id',
              as: 'author'
            }
          },
          {
            $unwind: '$author'
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$content',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        contentId: 1,
        contentType: 1,
        reason: 1,
        description: 1,
        status: 1,
        createdAt: 1,
        'reporter._id': 1,
        'reporter.name': 1,
        'reporter.email': 1,
        'content._id': 1,
        'content.text': 1,
        'content.createdAt': 1,
        'content.author._id': 1,
        'content.author.name': 1,
        'content.author.email': 1
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  return JSON.parse(JSON.stringify(reports));
}

async function getReviewStats() {
  await connectToDatabase();
  
  const pending = await ReportedContent.countDocuments({ status: 'pending' });
  const reviewed = await ReportedContent.countDocuments({ status: 'reviewed' });
  const resolved = await ReportedContent.countDocuments({ status: 'resolved' });
  const dismissed = await ReportedContent.countDocuments({ status: 'dismissed' });
  
  return {
    pending,
    reviewed,
    resolved,
    dismissed,
    total: pending + reviewed + resolved + dismissed
  };
}

export default async function AdminReviewQueuePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  const reports = await getReportedContent();
  const stats = await getReviewStats();

  return (
    <AdminLayout>
      <ReviewQueue reports={reports} stats={stats} />
    </AdminLayout>
  );
}
